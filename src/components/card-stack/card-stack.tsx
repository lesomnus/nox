import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { ScrollArea } from "../scroll-area/scroll-area";
import { useStackPresence } from "./use-stack-presence";
import { observeStackOcclusion } from "./stack-occlusion";
import styles from "./card-stack.module.css";

export type CardStackItemState = {
  depth: number;
  active: boolean;
  exiting: boolean;
};
export type CardStackSlot =
  | "card"
  | "front"
  | "back"
  | "exiting"
  | "scroll"
  | "viewport";
export type CardStackProps<T> = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T, state: CardStackItemState) => ReactNode;
  open: boolean;
  anchor: HTMLElement | null;
  /** A positioned container. Omit to portal to the document body. */
  container?: HTMLElement | null;
  /** Cards disappear below this element's top edge; defaults to the anchor. */
  occlusionBoundary?: HTMLElement | null;
  /** Fully-hidden travel endpoint; defaults to the occlusion boundary. */
  exitTarget?: HTMLElement | null;
  visibleCount?: number;
  scrollbarLabel?: string;
  getItemProps?: (
    item: T,
    state: CardStackItemState,
  ) => HTMLAttributes<HTMLDivElement>;
  classNames?: Partial<Record<CardStackSlot, string>>;
  ref?: Ref<HTMLDivElement>;
};

export function CardStack<T>({
  items,
  getKey,
  renderItem,
  open,
  anchor,
  container,
  occlusionBoundary,
  exitTarget,
  visibleCount = 3,
  scrollbarLabel = "Card content",
  getItemProps,
  classNames = {},
  className = "",
  style,
  ref,
  ...props
}: CardStackProps<T>) {
  if (!Number.isSafeInteger(visibleCount) || visibleCount < 1)
    throw new RangeError("visibleCount must be a positive safe integer.");
  const portal =
    container === undefined
      ? typeof document === "undefined"
        ? null
        : document.body
      : container;
  const boundary = occlusionBoundary ?? anchor;
  const target = exitTarget ?? boundary;
  const stack = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      stack.current = node;
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    },
    [ref],
  );
  const {
    current,
    visible,
    leaving,
    entryDepth,
    finish,
    promotionKey,
    finishPromotion,
  } = useStackPresence(
    items,
    open && !!anchor && !!portal,
    front,
    getKey,
    visibleCount,
  );
  const key = current === undefined ? "" : getKey(current);
  const leavingKey = leaving ? getKey(leaving.item) : "";
  const backs =
    current !== undefined
      ? visible.slice(1, visibleCount)
      : (leaving?.backs ?? []);
  const fixed = container === undefined;
  useLayoutEffect(() => {
    const cards = stack.current;
    if (!portal || !anchor || !cards || !boundary || !target) return;
    const position = () => {
      const typography = getComputedStyle(anchor);
      cards.style.setProperty(
        "--card-stack-font-family",
        typography.fontFamily,
      );
      cards.style.setProperty("--card-stack-color", typography.color);
      const bounds = fixed
        ? { left: 0, right: innerWidth, top: 0 }
        : portal.getBoundingClientRect();
      const button = anchor.getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(cards).columnGap) || 0;
      cards.style.setProperty(
        "--card-stack-space",
        `${Math.max(0, button.top - bounds.top - gap)}px`,
      );
      const end = target.getBoundingClientRect();
      cards.style.setProperty(
        "--card-stack-exit-offset",
        `${Math.max(0, end.top - button.top + gap)}px`,
      );
      cards.style.setProperty(
        "--card-stack-exit-radius",
        getComputedStyle(target).borderTopLeftRadius,
      );
      const box = cards.getBoundingClientRect();
      cards.style.setProperty("--card-stack-body-height", `${box.height}px`);
      cards.style.setProperty(
        "--card-stack-clip-offset",
        `${Math.max(0, boundary.getBoundingClientRect().top - button.top + gap)}px`,
      );
      const left = Math.max(
        bounds.left + gap,
        Math.min(
          button.left + button.width / 2 - box.width / 2,
          bounds.right - gap - box.width,
        ),
      );
      cards.style.left = `${left - bounds.left - (fixed ? 0 : portal.clientLeft) + (fixed ? 0 : portal.scrollLeft)}px`;
      cards.style.top = `${button.top - bounds.top - (fixed ? 0 : portal.clientTop) + (fixed ? 0 : portal.scrollTop) - gap - box.height}px`;
      cards.dataset.positioned = "true";
    };
    position();
    const stopOcclusion = observeStackOcclusion(cards, boundary);
    const observer = new ResizeObserver(position);
    for (const element of new Set([portal, anchor, cards, boundary, target]))
      observer.observe(element);
    const scroll = (event: Event) => {
      if (event.target instanceof Node && cards.contains(event.target)) return;
      position();
    };
    window.addEventListener("resize", position);
    window.addEventListener("scroll", scroll, true);
    return () => {
      observer.disconnect();
      stopOcclusion();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [
    portal,
    anchor,
    boundary,
    target,
    fixed,
    key,
    leavingKey,
    items.length,
    visibleCount,
  ]);

  const body = (item: T, state: CardStackItemState) => (
    <ScrollArea
      className={`${styles.scroll} ${classNames.scroll ?? ""}`}
      viewportClassName={classNames.viewport}
      scrollbarLabel={scrollbarLabel}
    >
      {renderItem(item, state)}
    </ScrollArea>
  );
  const activeState = { depth: 0, active: true, exiting: false };
  const exitState = { depth: 0, active: false, exiting: true };
  const activeProps =
    current === undefined ? {} : (getItemProps?.(current, activeState) ?? {});
  const exitProps = leaving
    ? (getItemProps?.(leaving.item, exitState) ?? {})
    : {};
  if ((current === undefined && !leaving) || !portal || !anchor) return null;
  return createPortal(
    <div
      {...props}
      ref={attach}
      className={`${styles.stack} ${className}`}
      data-card-stack
      data-departing={!!leaving}
      data-closing={current === undefined && !!leaving}
      data-pending-count={items.length}
      style={
        {
          ...style,
          position: fixed ? "fixed" : "absolute",
          "--card-stack-back-slots": visibleCount - 1,
          "--card-stack-back-count": backs.length,
          ...(current === undefined && leaving
            ? { height: leaving.height }
            : {}),
        } as CSSProperties
      }
    >
      {backs.map((item, index) => (
        <QueuedCard
          key={getKey(item)}
          item={item}
          itemKey={getKey(item)}
          depth={index + 1}
          refill={current !== undefined && promotionKey === key}
          closing={current === undefined}
          renderBody={body}
          getItemProps={getItemProps}
          classNames={classNames}
        />
      ))}
      {current !== undefined && (
        <div
          {...activeProps}
          ref={front}
          key={key}
          className={`${styles.surface} ${styles.request} ${classNames.card ?? ""} ${classNames.front ?? ""} ${activeProps.className ?? ""}`}
          data-card-key={key}
          data-motion={entryDepth ? "promote" : "arrive"}
          style={
            {
              ...activeProps.style,
              "--card-stack-entry-depth": entryDepth,
            } as CSSProperties
          }
          onAnimationEnd={(event) => {
            activeProps.onAnimationEnd?.(event);
            if (event.target === event.currentTarget) finishPromotion(key);
          }}
        >
          {body(current, activeState)}
        </div>
      )}
      {leaving && (
        <div
          {...exitProps}
          key={`leaving:${leavingKey}`}
          className={`${styles.departureClip} ${exitProps.className ?? ""}`}
          style={
            {
              ...exitProps.style,
              "--card-stack-leaving-height": `${leaving.height}px`,
            } as CSSProperties
          }
          inert
          aria-hidden="true"
          data-card-key={leavingKey}
        >
          <div
            className={`${styles.surface} ${styles.request} ${styles.leaving} ${classNames.card ?? ""} ${classNames.exiting ?? ""}`}
            style={{ height: leaving.height }}
            data-card-stack-exiting
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget) finish(leavingKey);
            }}
          >
            {body(leaving.item, exitState)}
          </div>
        </div>
      )}
    </div>,
    portal,
  );
}

function QueuedCard<T>({
  item,
  itemKey,
  depth,
  refill,
  closing,
  renderBody,
  getItemProps,
  classNames,
}: {
  item: T;
  itemKey: string;
  depth: number;
  refill: boolean;
  closing: boolean;
  renderBody: (item: T, state: CardStackItemState) => ReactNode;
  getItemProps?: CardStackProps<T>["getItemProps"];
  classNames: Partial<Record<CardStackSlot, string>>;
}) {
  const face = useRef<HTMLDivElement>(null);
  const before = useRef({ depth, closing });
  const [motion, setMotion] = useState({
    kind: refill ? "refill" : "arrive",
    from: depth,
  });
  useLayoutEffect(() => {
    const old = before.current;
    if (old.closing && !closing) setMotion({ kind: "arrive", from: depth });
    else if (old.depth > depth) setMotion({ kind: "advance", from: old.depth });
    else if (refill && !closing)
      setMotion((value) =>
        value.kind === "arrive" ? { kind: "refill", from: depth } : value,
      );
    before.current = { depth, closing };
  }, [depth, refill, closing]);
  useLayoutEffect(() => {
    if (motion.kind !== "advance") return;
    for (const animation of face.current?.getAnimations() ?? []) {
      animation.currentTime = 0;
      animation.play();
    }
  }, [motion]);
  const state = { depth, active: false, exiting: false };
  const props = getItemProps?.(item, state) ?? {};
  return (
    <div
      {...props}
      inert
      aria-hidden="true"
      data-card-stack-back={depth}
      data-card-key={itemKey}
      className={`${styles.backClip} ${props.className ?? ""}`}
      style={
        {
          ...props.style,
          "--card-stack-depth": depth,
          "--card-stack-from-depth": motion.from,
        } as CSSProperties
      }
    >
      <div
        ref={face}
        className={`${styles.surface} ${styles.back} ${classNames.card ?? ""} ${classNames.back ?? ""}`}
        data-back-motion={motion.kind}
      >
        {renderBody(item, state)}
      </div>
    </div>
  );
}
