import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
  type HTMLAttributes,
  type UIEvent,
  type UIEventHandler,
} from "react";
import styles from "./scroll-area.module.css";
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
export type ScrollAreaSlot =
  | "viewport"
  | "content"
  | "rail"
  | "thumb"
  | "handle"
  | "horizontalRail"
  | "horizontalThumb"
  | "horizontalHandle"
  | "fade"
  | "topFade"
  | "bottomFade";
export type ScrollAreaProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onScroll"
> & {
  children: ReactNode;
  scrollbarLabel?: string;
  /** Show an additional horizontal scrollbar when content overflows. */
  horizontalScrollbar?: boolean;
  horizontalScrollbarLabel?: string;
  viewportRef?: RefObject<HTMLDivElement | null>;
  viewportClassName?: string;
  contentClassName?: string;
  classNames?: Partial<Record<ScrollAreaSlot, string>>;
  onScroll?: UIEventHandler<HTMLDivElement>;
};

// Native scrolling keeps wheel, touch and focus navigation predictable; only
// its visual handle is custom, sharing the conversation handle's appearance.
export function ScrollArea({
  children,
  viewportRef,
  scrollbarLabel = "Scroll",
  horizontalScrollbar = false,
  horizontalScrollbarLabel = "Scroll horizontally",
  className = "",
  classNames = {},
  viewportClassName = "",
  contentClassName = "",
  onScroll,
  onPointerMove,
  onPointerLeave,
  ...props
}: ScrollAreaProps) {
  const slot = (name: ScrollAreaSlot) =>
    `${styles[name]} ${classNames[name] ?? ""}`;
  const id = useId();
  const region = useRef<HTMLDivElement>(null);
  const pane = useRef<HTMLDivElement>(null);
  const attachPane = useCallback(
    (node: HTMLDivElement | null) => {
      pane.current = node;
      if (viewportRef) viewportRef.current = node;
    },
    [viewportRef],
  );
  const content = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointer: number; y: number; top: number } | null>(null);
  const horizontalDrag = useRef<{
    pointer: number;
    x: number;
    left: number;
  } | null>(null);
  const motion = useRef({ top: 0, time: 0, strength: 0 });
  const motionRaf = useRef(0);
  const [near, setNear] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState({ top: 0, max: 0, height: 0, thumb: 0 });
  const [horizontalView, setHorizontalView] = useState({
    left: 0,
    max: 0,
    width: 0,
    thumb: 0,
  });

  function measure() {
    const el = pane.current;
    if (!el || !rail.current) return;
    const style = getComputedStyle(rail.current);
    const available = el.clientHeight;
    const max = Math.max(0, el.scrollHeight - available);
    const railMin =
      parseFloat(style.getPropertyValue("--ui-scroll-area-rail-min-size")) || 0;
    const railMax =
      parseFloat(style.getPropertyValue("--ui-scroll-area-rail-max-size")) ||
      available;
    const railRatio =
      parseFloat(style.getPropertyValue("--ui-scroll-area-rail-max-ratio")) ||
      1;
    const railGrowth =
      parseFloat(style.getPropertyValue("--ui-scroll-area-rail-growth")) || 1;
    // The centered travel range grows with overflow, rather than consuming
    // the viewport's entire edge as soon as a scrollbar becomes necessary.
    const height = Math.min(
      available,
      railMax,
      available * clamp(railRatio, 0, 1),
      railMin + max * railGrowth,
    );
    const maxSize =
      parseFloat(style.getPropertyValue("--ui-scroll-area-thumb-max-size")) ||
      height;
    const maxRatio =
      parseFloat(style.getPropertyValue("--ui-scroll-area-thumb-max-ratio")) ||
      1;
    const top = clamp(el.scrollTop, 0, max);
    region.current?.style.setProperty(
      "--ui-scroll-area-top-hidden",
      `${top}px`,
    );
    region.current?.style.setProperty(
      "--ui-scroll-area-bottom-hidden",
      `${max - top}px`,
    );
    region.current?.style.setProperty(
      "--ui-scroll-area-top-opacity",
      top > 0 ? "1" : "0",
    );
    region.current?.style.setProperty(
      "--ui-scroll-area-bottom-opacity",
      max > top ? "1" : "0",
    );
    const thumb = Math.min(
      height,
      // Keep both drawing and drag travel based on the same capped size.
      // Short rails still retain a usable minimum grab area.
      Math.max(32, Math.min(maxSize, height * clamp(maxRatio, 0, 1))),
      Math.max(32, (height * el.clientHeight) / (el.scrollHeight || 1)),
    );
    setView({
      top,
      max,
      height,
      thumb,
    });
    if (horizontalScrollbar) {
      const availableWidth = el.clientWidth;
      const maxHorizontal = Math.max(0, el.scrollWidth - availableWidth);
      const width = Math.min(
        availableWidth,
        railMax,
        availableWidth * clamp(railRatio, 0, 1),
        railMin + maxHorizontal * railGrowth,
      );
      setHorizontalView({
        left: clamp(el.scrollLeft, 0, maxHorizontal),
        max: maxHorizontal,
        width,
        thumb: Math.min(
          width,
          Math.max(32, Math.min(maxSize, width * clamp(maxRatio, 0, 1))),
          Math.max(32, (width * availableWidth) / (el.scrollWidth || 1)),
        ),
      });
    }
  }
  function paintMotion(strength: number) {
    // Extend the edge where content leaves the viewport, without re-rendering
    // the session list on every animation frame.
    region.current?.style.setProperty(
      "--ui-scroll-area-top-motion",
      `${Math.max(0, strength)}`,
    );
    region.current?.style.setProperty(
      "--ui-scroll-area-bottom-motion",
      `${Math.max(0, -strength)}`,
    );
  }
  function settleMotion(time: number) {
    const sample = motion.current;
    const strength = sample.strength * Math.exp(-(time - sample.time) / 110);
    paintMotion(Math.abs(strength) < 0.01 ? 0 : strength);
    if (Math.abs(strength) >= 0.01)
      motionRaf.current = requestAnimationFrame(settleMotion);
  }
  function scrolled(event: UIEvent<HTMLDivElement>) {
    const el = pane.current;
    if (!el) return;
    const sample = motion.current;
    const time = performance.now();
    const delta = el.scrollTop - sample.top;
    if (delta) {
      sample.strength = clamp(
        delta / clamp(time - sample.time, 16, 48) / 1.5,
        -1,
        1,
      );
      sample.time = time;
      paintMotion(sample.strength);
      cancelAnimationFrame(motionRaf.current);
      motionRaf.current = requestAnimationFrame(settleMotion);
    }
    sample.top = el.scrollTop;
    measure();
    onScroll?.(event);
  }
  useEffect(() => {
    const observer = new ResizeObserver(measure);
    observer.observe(pane.current!);
    observer.observe(content.current!);
    measure();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(motionRaf.current);
    };
  }, [horizontalScrollbar]);

  const travel = Math.max(0, view.height - view.thumb);
  const horizontalTravel = Math.max(
    0,
    horizontalView.width - horizontalView.thumb,
  );
  return (
    <div
      ref={region}
      {...props}
      className={`${styles.area} ${className}`}
      data-scroll-area="root"
      data-horizontal-scrollbar={horizontalScrollbar || undefined}
      data-near={near || undefined}
      data-dragging={dragging || undefined}
      data-horizontal-overflow={
        (horizontalScrollbar && horizontalView.max > 0) || undefined
      }
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setNear(
          event.clientX >
            bounds.right -
              (parseFloat(
                getComputedStyle(event.currentTarget).getPropertyValue(
                  "--ui-scroll-area-near-distance",
                ),
              ) || 32),
        );
        onPointerMove?.(event);
      }}
      onPointerLeave={(event) => {
        setNear(false);
        onPointerLeave?.(event);
      }}
    >
      <div
        ref={attachPane}
        id={id}
        className={`${slot("viewport")} ${viewportClassName}`}
        data-scroll-area="viewport"
        onScroll={scrolled}
      >
        <div
          ref={content}
          className={`${slot("content")} ${contentClassName}`}
          data-scroll-area="content"
        >
          {children}
        </div>
      </div>
      <div
        className={`${slot("fade")} ${slot("topFade")}`}
        aria-hidden="true"
      />
      <div
        className={`${slot("fade")} ${slot("bottomFade")}`}
        aria-hidden="true"
      />
      <div
        ref={rail}
        className={slot("rail")}
        data-scroll-area="rail"
        style={{ height: view.height }}
      >
        {view.max > 0 && (
          <div
            className={slot("thumb")}
            role="scrollbar"
            tabIndex={0}
            aria-label={scrollbarLabel}
            aria-orientation="vertical"
            aria-controls={id}
            aria-valuemin={0}
            aria-valuemax={Math.round(view.max)}
            aria-valuenow={Math.round(view.top)}
            style={{
              top: view.max ? (view.top / view.max) * travel : 0,
              height: view.thumb,
            }}
            onPointerDown={(event) => {
              if (event.button !== 0 || !travel) return;
              event.preventDefault();
              event.currentTarget.focus({ preventScroll: true });
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = {
                pointer: event.pointerId,
                y: event.clientY,
                top: pane.current!.scrollTop,
              };
              setDragging(true);
            }}
            onPointerMove={(event) => {
              const active = drag.current;
              if (!active || active.pointer !== event.pointerId || !travel)
                return;
              pane.current!.scrollTop =
                active.top + ((event.clientY - active.y) * view.max) / travel;
            }}
            onLostPointerCapture={() => {
              drag.current = null;
              setDragging(false);
            }}
            onKeyDown={(event) => {
              const el = pane.current!;
              const positions: Record<string, number> = {
                ArrowUp: el.scrollTop - 40,
                ArrowDown: el.scrollTop + 40,
                PageUp: el.scrollTop - el.clientHeight,
                PageDown: el.scrollTop + el.clientHeight,
                Home: 0,
                End: view.max,
              };
              const next = positions[event.key];
              if (next === undefined) return;
              event.preventDefault();
              el.scrollTop = next;
            }}
          >
            <span className={slot("handle")} data-scroll-area="handle" />
          </div>
        )}
      </div>
      {horizontalScrollbar && horizontalView.max > 0 && (
        <div
          className={slot("horizontalRail")}
          data-scroll-area="horizontal-rail"
          style={{ width: horizontalView.width }}
        >
          <div
            className={slot("horizontalThumb")}
            role="scrollbar"
            tabIndex={0}
            aria-label={horizontalScrollbarLabel}
            aria-orientation="horizontal"
            aria-controls={id}
            aria-valuemin={0}
            aria-valuemax={Math.round(horizontalView.max)}
            aria-valuenow={Math.round(horizontalView.left)}
            style={{
              left: horizontalView.max
                ? (horizontalView.left / horizontalView.max) * horizontalTravel
                : 0,
              width: horizontalView.thumb,
            }}
            onPointerDown={(event) => {
              if (event.button !== 0 || !horizontalTravel) return;
              event.preventDefault();
              event.currentTarget.focus({ preventScroll: true });
              event.currentTarget.setPointerCapture(event.pointerId);
              horizontalDrag.current = {
                pointer: event.pointerId,
                x: event.clientX,
                left: pane.current!.scrollLeft,
              };
              setDragging(true);
            }}
            onPointerMove={(event) => {
              const active = horizontalDrag.current;
              if (
                !active ||
                active.pointer !== event.pointerId ||
                !horizontalTravel
              )
                return;
              pane.current!.scrollLeft =
                active.left +
                ((event.clientX - active.x) * horizontalView.max) /
                  horizontalTravel;
            }}
            onLostPointerCapture={() => {
              horizontalDrag.current = null;
              setDragging(false);
            }}
            onKeyDown={(event) => {
              const el = pane.current!;
              const positions: Record<string, number> = {
                ArrowLeft: el.scrollLeft - 40,
                ArrowRight: el.scrollLeft + 40,
                PageUp: el.scrollLeft - el.clientWidth,
                PageDown: el.scrollLeft + el.clientWidth,
                Home: 0,
                End: horizontalView.max,
              };
              const next = positions[event.key];
              if (next === undefined) return;
              event.preventDefault();
              el.scrollLeft = next;
            }}
          >
            <span
              className={slot("horizontalHandle")}
              data-scroll-area="horizontal-handle"
            />
          </div>
        </div>
      )}
    </div>
  );
}
