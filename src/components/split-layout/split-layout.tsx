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
  maxRatio,
  minRatio,
  moveSplits,
  splitJunctions,
  type Junction,
  type MeasuredSplit,
  type SplitDrag,
  type SplitNode,
} from "./split-layout-model";
import styles from "./split-layout.module.css";

export { setSplitRatio } from "./split-layout-model";
export type { SplitNode } from "./split-layout-model";

type Split = Extract<SplitNode, { kind: "split" }>;
type Elements = { node: Split; handle: HTMLDivElement };
type Drag = { pointer: number; x: number; y: number; targets: SplitDrag[] };
type Controls = {
  register: (node: Split, handle: HTMLDivElement | null) => void;
  start: (event: PointerEvent<HTMLDivElement>, ids: string[]) => void;
  move: (event: PointerEvent<HTMLDivElement>) => void;
  end: (event: PointerEvent<HTMLDivElement>) => void;
  key: (event: KeyboardEvent<HTMLDivElement>, ids: string[]) => void;
  reset: (ids: string[]) => void;
  dragging: readonly string[];
};

/** A controlled split tree with continuous, jointly draggable divider junctions. */
export function SplitLayout({
  node,
  renderPane,
  onResize,
  separatorLabel = "Resize panes",
  junctionLabel = "Resize both axes",
}: {
  node: SplitNode;
  renderPane: (id: string) => ReactNode;
  onResize: (id: string, ratio: number) => void;
  separatorLabel?: string;
  junctionLabel?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const elements = useRef(new Map<string, Elements>());
  const observer = useRef<ResizeObserver | undefined>(undefined);
  const drag = useRef<Drag | undefined>(undefined);
  const pinned = useRef<{ id: string; ids: string[] } | undefined>(undefined);
  const [dragging, setDragging] = useState<string[]>([]);
  const [junctions, setJunctions] = useState<Junction[]>([]);
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
    if (
      drag.current?.targets.some((target) => !elements.current.has(target.id))
    ) {
      drag.current = undefined;
      pinned.current = undefined;
      setDragging([]);
    }
    measure();
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
    for (const change of changes)
      if (elements.current.get(change.id)?.node.ratio !== change.ratio)
        onResize(change.id, change.ratio);
  }
  const controls: Controls = {
    register,
    dragging,
    reset: (ids) => apply(ids.map((id) => ({ id, ratio: 0.5 }))),
    start: (event, ids) => {
      if (event.button !== 0 || drag.current) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.focus({ preventScroll: true });
      drag.current = {
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        targets: targets(ids),
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(ids);
    },
    move: (event) => {
      const origin = drag.current;
      if (
        !origin ||
        origin.pointer !== event.pointerId ||
        !event.currentTarget.hasPointerCapture(event.pointerId)
      )
        return;
      apply(
        moveSplits(
          origin.targets,
          event.clientX - origin.x,
          event.clientY - origin.y,
        ),
      );
    },
    end: (event) => {
      if (drag.current?.pointer !== event.pointerId) return;
      drag.current = undefined;
      setDragging([]);
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
    },
    key: (event, ids) => {
      const entries = targets(ids);
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
    <div ref={root} className={styles.layout} data-split-layout>
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
          style={
            {
              left: `${junction.x}%`,
              top: `${junction.y}%`,
              "--line-left": junction.left ? "0%" : "50%",
              "--line-right": junction.right ? "0%" : "50%",
              "--line-top": junction.top ? "0%" : "50%",
              "--line-bottom": junction.bottom ? "0%" : "50%",
            } as CSSProperties
          }
          role="button"
          tabIndex={0}
          aria-label={junctionLabel}
          onFocus={() => {
            pinned.current = { id: junction.id, ids: junction.ids };
          }}
          onBlur={() => {
            if (!drag.current) pinned.current = undefined;
          }}
          onDoubleClick={() => controls.reset(junction.ids)}
          onPointerDown={(event) => controls.start(event, junction.ids)}
          onPointerMove={controls.move}
          onPointerUp={controls.end}
          onPointerCancel={controls.end}
          onLostPointerCapture={controls.end}
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
        data-dragging={controls.dragging.includes(node.id) || undefined}
        role="separator"
        tabIndex={0}
        aria-label={separatorLabel}
        aria-orientation={
          node.axis === "horizontal" ? "vertical" : "horizontal"
        }
        aria-valuemin={minRatio * 100}
        aria-valuemax={maxRatio * 100}
        aria-valuenow={Math.round(boundRatio(node.ratio) * 100)}
        onDoubleClick={() => controls.reset([node.id])}
        onPointerDown={(event) => controls.start(event, [node.id])}
        onPointerMove={controls.move}
        onPointerUp={controls.end}
        onPointerCancel={controls.end}
        onLostPointerCapture={controls.end}
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
