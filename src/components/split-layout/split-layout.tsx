import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  boundRatio,
  detachCrossing,
  findSplit,
  setSplitRatio,
  maxRatio,
  minRatio,
  moveSplits,
  alignedSplitIds,
  snapSplitMove,
  splitPeers,
  splitJunctions,
  type Junction,
  type MeasuredSplit,
  type SplitDrag,
  type SplitNode,
  type SplitPeer,
  type SplitSnaps,
} from "./split-layout-model";
import styles from "./split-layout.module.css";

export { setSplitRatio } from "./split-layout-model";
export type { SplitNode } from "./split-layout-model";

type Split = Extract<SplitNode, { kind: "split" }>;
type Elements = { node: Split; handle: HTMLDivElement };
type Drag = {
  pointer: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  targets: SplitDrag[];
  peers: SplitPeer[];
  snaps: SplitSnaps;
  primary?: string;
  detached: boolean;
  distance: number;
  releaseDistance: number;
  tolerance: number;
  delay: number;
  travel: number;
  baseTree: SplitNode;
  pending?: { marker: string; target: string };
  released?: boolean;
};
type Resize = (id: string, ratio: number) => void;
export type SplitLayoutProps = {
  node: SplitNode;
  renderPane: (id: string) => ReactNode;
  separatorLabel?: string;
  junctionLabel?: string;
} & (
  | { onChange: (node: SplitNode) => void; onResize?: Resize }
  | { onChange?: undefined; onResize: Resize }
);
type Controls = {
  register: (node: Split, handle: HTMLDivElement | null) => void;
  start: (event: PointerEvent<HTMLDivElement>, ids: string[]) => void;
  move: (event: PointerEvent<HTMLDivElement>) => void;
  end: (event: PointerEvent<HTMLDivElement>) => void;
  cancel: (event: PointerEvent<HTMLDivElement>) => void;
  key: (event: KeyboardEvent<HTMLDivElement>, ids: string[]) => void;
  reset: (ids: string[]) => void;
  dragging: readonly string[];
  highlighted: ReadonlySet<string>;
  detached: ReadonlySet<string>;
  hover: (ids: string[]) => void;
  focus: (ids: string[], visible: boolean) => void;
  blur: () => void;
  double: (id: string) => void;
};

/** A controlled split tree with continuous, jointly draggable divider junctions. */
export function SplitLayout({
  node,
  renderPane,
  onResize,
  onChange,
  separatorLabel = "Resize panes",
  junctionLabel = "Resize both axes",
}: SplitLayoutProps) {
  const root = useRef<HTMLDivElement>(null);
  const elements = useRef(new Map<string, Elements>());
  const observer = useRef<ResizeObserver | undefined>(undefined);
  const drag = useRef<Drag | undefined>(undefined);
  const peers = useRef<SplitPeer[]>([]);
  const detached = useRef(new Set<string>());
  const lastClick = useRef<
    | {
        id?: string;
        ids: string[];
        x: number;
        y: number;
        time: number;
        moved: number;
        tolerance: number;
        delay: number;
      }
    | undefined
  >(undefined);
  const sequence = useRef(0);
  const pinned = useRef<{ id: string; ids: string[] } | undefined>(undefined);
  const [dragging, setDragging] = useState<string[]>([]);
  const [junctions, setJunctions] = useState<Junction[]>([]);
  const [hovered, setHovered] = useState<string[]>([]);
  const [focused, setFocused] = useState<string[]>([]);
  const [snapped, setSnapped] = useState<string[]>([]);
  const [armed, setArmed] = useState<string[]>([]);
  const register = useCallback((node: Split, handle: HTMLDivElement | null) => {
    const previous = elements.current.get(node.id);
    if (previous) observer.current?.unobserve(previous.handle);
    if (handle) {
      elements.current.set(node.id, { node, handle });
      observer.current?.observe(handle);
    } else elements.current.delete(node.id);
  }, []);
  const measure = useCallback(() => {
    if (!root.current) return;
    const splits: MeasuredSplit[] = [...elements.current.values()].map(
      ({ node, handle }) => ({
        node,
        handle: handle.getBoundingClientRect(),
      }),
    );
    const next = splitJunctions(splits, root.current.getBoundingClientRect());
    peers.current = splitPeers(splits);
    // Preserve the focused/captured element when T junctions merge into a cross.
    const anchor = pinned.current;
    const active =
      anchor &&
      next.find((joint) => anchor.ids.every((id) => joint.ids.includes(id)));
    if (active) active.id = anchor!.id;
    setJunctions((current) =>
      JSON.stringify(current) === JSON.stringify(next) ? current : next,
    );
  }, []);
  useLayoutEffect(() => {
    let pruned = false;
    for (const id of detached.current)
      if (!elements.current.has(id)) {
        detached.current.delete(id);
        pruned = true;
      }
    if (pruned) setArmed([...detached.current]);
    measure();
    const pending = drag.current?.pending;
    if (pending) {
      if (
        elements.current.has(pending.marker) &&
        elements.current.has(pending.target)
      ) {
        const origin = drag.current!;
        origin.targets = targets([pending.target]);
        origin.primary = pending.target;
        origin.peers = peers.current;
        origin.pending = undefined;
        arm(pending.target);
        elements.current
          .get(pending.target)!
          .handle.focus({ preventScroll: true });
        setDragging([pending.target]);
        apply(moveSplits(origin.targets, origin.dx, origin.dy));
        if (origin.released) complete(origin);
      }
      return;
    }
    if (
      drag.current?.targets.some((target) => !elements.current.has(target.id))
    ) {
      drag.current = undefined;
      pinned.current = undefined;
      setDragging([]);
      setSnapped([]);
    }
  }, [node, measure]);
  useLayoutEffect(() => {
    const current = new ResizeObserver(measure);
    observer.current = current;
    if (root.current) current.observe(root.current);
    for (const { handle } of elements.current.values()) current.observe(handle);
    return () => {
      current.disconnect();
      observer.current = undefined;
    };
  }, [measure]);

  function targets(ids: string[]): SplitDrag[] {
    return ids.flatMap((id) => {
      const entry = elements.current.get(id);
      if (!entry) return [];
      const { node, handle } = entry;
      const bounds = handle.parentElement!.getBoundingClientRect();
      const gutter = handle.getBoundingClientRect();
      return [
        {
          id,
          axis: node.axis,
          ratio: node.ratio,
          size:
            node.axis === "horizontal"
              ? bounds.width - gutter.width
              : bounds.height - gutter.height,
        },
      ];
    });
  }
  function apply(changes: { id: string; ratio: number }[]) {
    if (onChange) {
      const next = changes.reduce((tree, change) => {
        const entry = elements.current.get(change.id);
        return entry && entry.node.ratio !== change.ratio
          ? setSplitRatio(tree, change.id, change.ratio)
          : tree;
      }, node);
      if (next !== node) onChange(next);
      return;
    }
    for (const change of changes)
      if (
        elements.current.has(change.id) &&
        elements.current.get(change.id)!.node.ratio !== change.ratio
      )
        onResize?.(change.id, change.ratio);
  }
  function group(ids: string[]) {
    return alignedSplitIds(ids, peers.current, detached.current);
  }
  function arm(id: string) {
    detached.current.add(id);
    setArmed([...detached.current]);
    setHovered([id]);
    setFocused((current) => (current.length ? [id] : current));
  }
  function complete(origin: Drag, cancel = false) {
    if (cancel) {
      if (onChange) onChange(origin.baseTree);
      else apply(origin.targets.map(({ id, ratio }) => ({ id, ratio })));
    }
    const moved = origin.travel;
    lastClick.current = !cancel
      ? {
          id: origin.primary,
          ids: origin.targets.map((target) => target.id),
          x: origin.x,
          y: origin.y,
          time: performance.now(),
          moved,
          tolerance: origin.tolerance,
          delay: origin.delay,
        }
      : undefined;
    if (origin.primary && origin.detached && (cancel || moved > 0.5)) {
      detached.current.delete(origin.primary);
      setArmed([...detached.current]);
    }
    drag.current = undefined;
    setDragging([]);
    setSnapped([]);
    if (!cancel) setHovered(group(origin.targets.map((target) => target.id)));
    if (root.current?.hasPointerCapture(origin.pointer))
      root.current.releasePointerCapture(origin.pointer);
  }
  function finish(event: PointerEvent<HTMLDivElement>, cancel = false) {
    const origin = drag.current;
    if (!origin || origin.pointer !== event.pointerId) return;
    if (origin.pending && !cancel) {
      origin.released = true;
      return;
    }
    complete(origin, cancel);
  }
  function crossingAt(id: string, x: number, y: number) {
    if (!onChange) return undefined;
    const split = findSplit(node, id);
    const entry = elements.current.get(id);
    if (
      !split ||
      !entry ||
      split.first.kind !== "split" ||
      split.second.kind !== "split" ||
      split.first.axis === split.axis ||
      split.second.axis !== split.first.axis
    )
      return undefined;
    const a = elements.current
      .get(split.first.id)
      ?.handle.getBoundingClientRect();
    const b = elements.current
      .get(split.second.id)
      ?.handle.getBoundingClientRect();
    if (!a || !b) return undefined;
    const vertical = split.axis === "horizontal";
    const first = vertical ? a.top + a.height / 2 : a.left + a.width / 2;
    const second = vertical ? b.top + b.height / 2 : b.left + b.width / 2;
    if (Math.abs(first - second) >= 0.5) return undefined;
    const bounds = entry.handle.parentElement!.getBoundingClientRect();
    const available = vertical
      ? bounds.height - a.height
      : bounds.width - a.width;
    return {
      second: (vertical ? y : x) > (first + second) / 2,
      tolerance: available > 0 ? 0.5 / available : 0,
    };
  }
  function uniqueId(base: string) {
    const used = (tree: SplitNode, id: string): boolean =>
      tree.id === id ||
      (tree.kind === "split" &&
        (used(tree.first, id) || used(tree.second, id)));
    let id: string;
    do {
      id = `${base}:part-${++sequence.current}`;
    } while (used(node, id));
    return id;
  }
  const controls: Controls = {
    register,
    dragging,
    highlighted: new Set([...hovered, ...focused, ...dragging, ...snapped]),
    detached: new Set(armed),
    hover: (ids) => setHovered(group(ids)),
    focus: (ids, visible) => setFocused(visible ? group(ids) : []),
    blur: () => setFocused([]),
    double: (id) => {
      const previous = lastClick.current;
      if (
        detached.current.has(id) ||
        group([id]).length > 1 ||
        (!!previous && !!crossingAt(id, previous.x, previous.y))
      )
        arm(id);
      else controls.reset([id]);
    },
    reset: (ids) => apply(group(ids).map((id) => ({ id, ratio: 0.5 }))),
    start: (event, ids) => {
      if (event.button !== 0 || drag.current || !root.current) return;
      const style = getComputedStyle(root.current);
      const token = (name: string, time = false) => {
        const value = style.getPropertyValue(name).trim();
        const number =
          parseFloat(value) *
          (time && value.endsWith("s") && !value.endsWith("ms") ? 1000 : 1);
        return Number.isFinite(number) ? Math.max(0, number) : 0;
      };
      const tolerance = token("--ui-split-click-tolerance");
      const delay = token("--ui-split-double-click-delay", true);
      const primary = ids.length === 1 ? ids[0] : undefined;
      const previous = lastClick.current;
      const crossing = primary
        ? crossingAt(primary, event.clientX, event.clientY)
        : undefined;
      const repeated =
        primary &&
        previous?.id === primary &&
        previous.moved <= previous.tolerance &&
        performance.now() - previous.time <= delay &&
        Math.hypot(event.clientX - previous.x, event.clientY - previous.y) <=
          tolerance;
      const separate =
        !!primary &&
        (detached.current.has(primary) ||
          (!!repeated && (group(ids).length > 1 || !!crossing)));
      if (separate) arm(primary!);
      const joined = separate ? ids : group(ids);
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.focus({ preventScroll: true });
      drag.current = {
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        dx: 0,
        dy: 0,
        primary,
        detached: separate,
        targets: targets(joined),
        peers: peers.current,
        snaps: {},
        distance: separate ? 0 : token("--ui-split-snap-distance"),
        releaseDistance: token("--ui-split-snap-release-distance"),
        tolerance,
        delay,
        travel: 0,
        baseTree: node,
      };
      root.current.setPointerCapture(event.pointerId);
      setDragging(joined);
      if (separate && crossing && primary && onChange) {
        const marker = uniqueId(primary);
        const rotation = detachCrossing(
          node,
          primary,
          marker,
          crossing.tolerance,
        );
        if (rotation) {
          const target = crossing.second ? rotation.second : rotation.first;
          detached.current.delete(primary);
          arm(target);
          drag.current.pending = { marker, target };
          setDragging([target]);
          onChange(rotation.node);
        }
      }
    },
    move: (event) => {
      const origin = drag.current;
      if (
        !origin ||
        origin.pointer !== event.pointerId ||
        !event.currentTarget.hasPointerCapture(event.pointerId)
      )
        return;
      origin.dx = event.clientX - origin.x;
      origin.dy = event.clientY - origin.y;
      origin.travel = Math.max(origin.travel, Math.hypot(origin.dx, origin.dy));
      if (origin.pending) return;
      const next = snapSplitMove(
        origin.targets,
        origin.peers,
        origin.dx,
        origin.dy,
        origin.distance,
        origin.releaseDistance,
        origin.snaps,
      );
      origin.snaps = next.snaps;
      setSnapped((current) =>
        current.join("\0") === next.ids.join("\0") ? current : next.ids,
      );
      apply(next.changes);
    },
    end: (event) => finish(event),
    cancel: (event) => {
      if (event.type === "lostpointercapture" && drag.current?.released) return;
      finish(event, true);
    },
    key: (event, ids) => {
      const entries = targets(group(ids));
      if (["Enter", " "].includes(event.key) && ids.length > 1) {
        event.preventDefault();
        controls.reset(ids);
        return;
      }
      if (["Home", "End"].includes(event.key)) {
        event.preventDefault();
        const delta = event.key === "Home" ? -Infinity : Infinity;
        apply(moveSplits(entries, delta, delta));
        return;
      }
      const axis =
        event.key === "ArrowLeft" || event.key === "ArrowRight"
          ? "horizontal"
          : event.key === "ArrowUp" || event.key === "ArrowDown"
            ? "vertical"
            : undefined;
      const first = entries.find((entry) => entry.axis === axis);
      if (!first) return;
      event.preventDefault();
      const delta =
        first.size *
        (event.shiftKey ? 0.1 : 0.02) *
        (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1);
      apply(
        moveSplits(
          entries,
          axis === "horizontal" ? delta : 0,
          axis === "vertical" ? delta : 0,
        ),
      );
    },
  };

  return (
    <div
      ref={root}
      className={styles.layout}
      data-split-layout
      onPointerMove={controls.move}
      onPointerUp={controls.end}
      onPointerCancel={controls.cancel}
      onLostPointerCapture={controls.cancel}
      onDoubleClick={(event) => {
        const click = lastClick.current;
        if (
          drag.current?.released ||
          !click ||
          click.moved > 0.5 ||
          performance.now() - click.time > click.delay ||
          Math.hypot(event.clientX - click.x, event.clientY - click.y) >
            click.tolerance
        )
          return;
        const target = event.target as Element;
        if (
          target !== event.currentTarget &&
          !target.closest("[data-split-id], [data-split-junction]")
        )
          return;
        if (click.id) controls.double(click.id);
        else controls.reset(click.ids);
      }}
    >
      <SplitBranch
        node={node}
        renderPane={renderPane}
        separatorLabel={separatorLabel}
        controls={controls}
      />
      {junctions.map((junction) => (
        <div
          key={junction.id}
          className={styles.junction}
          data-split-junction
          data-dragging={
            dragging.some((id) => junction.ids.includes(id)) || undefined
          }
          data-highlight-vertical={
            junction.ids.some(
              (id) =>
                controls.highlighted.has(id) &&
                elements.current.get(id)?.node.axis === "horizontal",
            ) || undefined
          }
          data-highlight-horizontal={
            junction.ids.some(
              (id) =>
                controls.highlighted.has(id) &&
                elements.current.get(id)?.node.axis === "vertical",
            ) || undefined
          }
          style={
            {
              left: `${junction.x}%`,
              top: `${junction.y}%`,
              "--line-left": junction.left
                ? "var(--bridge-inset)"
                : "calc(50% - var(--vertical-size) / 2)",
              "--line-right": junction.right
                ? "var(--bridge-inset)"
                : "calc(50% - var(--vertical-size) / 2)",
              "--line-top": junction.top
                ? "var(--bridge-inset)"
                : "calc(50% - var(--horizontal-size) / 2)",
              "--line-bottom": junction.bottom
                ? "var(--bridge-inset)"
                : "calc(50% - var(--horizontal-size) / 2)",
            } as CSSProperties
          }
          role="button"
          tabIndex={0}
          aria-label={junctionLabel}
          onFocus={() => {
            pinned.current = { id: junction.id, ids: junction.ids };
            controls.focus(junction.ids, true);
          }}
          onBlur={() => {
            if (!drag.current) pinned.current = undefined;
            controls.blur();
          }}
          onPointerEnter={() => controls.hover(junction.ids)}
          onPointerLeave={() => controls.hover([])}
          onPointerDown={(event) => controls.start(event, junction.ids)}
          onKeyDown={(event) => controls.key(event, junction.ids)}
        />
      ))}
    </div>
  );
}

function SplitBranch({
  node,
  renderPane,
  separatorLabel,
  controls,
}: {
  node: SplitNode;
  renderPane: (id: string) => ReactNode;
  separatorLabel: string;
  controls: Controls;
}) {
  if (node.kind === "pane")
    return <div className={styles.pane}>{renderPane(node.id)}</div>;
  return (
    <div className={styles.split} data-axis={node.axis}>
      <div className={styles.part} style={{ flex: `${node.ratio} 1 0%` }}>
        <SplitBranch
          node={node.first}
          renderPane={renderPane}
          separatorLabel={separatorLabel}
          controls={controls}
        />
      </div>
      <div
        ref={(element) => controls.register(node, element)}
        className={styles.separator}
        data-split-id={node.id}
        data-axis={node.axis}
        data-dragging={controls.dragging.includes(node.id) || undefined}
        data-highlighted={controls.highlighted.has(node.id) || undefined}
        data-detached={controls.detached.has(node.id) || undefined}
        role="separator"
        tabIndex={0}
        aria-label={separatorLabel}
        aria-orientation={
          node.axis === "horizontal" ? "vertical" : "horizontal"
        }
        aria-valuemin={minRatio * 100}
        aria-valuemax={maxRatio * 100}
        aria-valuenow={Math.round(boundRatio(node.ratio) * 100)}
        onPointerEnter={() => controls.hover([node.id])}
        onPointerLeave={() => controls.hover([])}
        onFocus={(event) =>
          controls.focus(
            [node.id],
            event.currentTarget.matches(":focus-visible"),
          )
        }
        onBlur={controls.blur}
        onPointerDown={(event) => controls.start(event, [node.id])}
        onKeyDown={(event) => controls.key(event, [node.id])}
      />
      <div className={styles.part} style={{ flex: `${1 - node.ratio} 1 0%` }}>
        <SplitBranch
          node={node.second}
          renderPane={renderPane}
          separatorLabel={separatorLabel}
          controls={controls}
        />
      </div>
    </div>
  );
}
