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
  type CSSProperties,
  type PointerEvent,
} from "react";
import styles from "./scroll-area.module.css";
import { WheelScroller } from "./wheel-scroller";
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
  /** Handle-center offset in pixels: positive outside, negative inside. */
  scrollbarOffset?: number;
  /** Show an additional horizontal scrollbar when content overflows. */
  horizontalScrollbar?: boolean;
  /** Native wheel animation, or JS-controlled scrolling from the first event. */
  wheelBehavior?: "native" | "instant";
  /** JS smoothing time constant in ms for instant mode; 0 disables it. Default 70. */
  wheelSmoothing?: number;
  horizontalScrollbarLabel?: string;
  viewportRef?: RefObject<HTMLDivElement | null>;
  viewportClassName?: string;
  contentClassName?: string;
  classNames?: Partial<Record<ScrollAreaSlot, string>>;
  onScroll?: UIEventHandler<HTMLDivElement>;
};

// A native viewport preserves touch, focus and keyboard navigation. Callers can
// opt out of browser wheel animation while retaining the event's own deltas.
export function ScrollArea({
  children,
  viewportRef,
  scrollbarLabel = "Scroll",
  scrollbarOffset,
  horizontalScrollbar = false,
  wheelBehavior = "native",
  wheelSmoothing = 70,
  horizontalScrollbarLabel = "Scroll horizontally",
  className = "",
  classNames = {},
  viewportClassName = "",
  contentClassName = "",
  style,
  onScroll,
  onPointerMove,
  onPointerLeave,
  ...props
}: ScrollAreaProps) {
  const offset = Number.isFinite(scrollbarOffset) ? scrollbarOffset : undefined;
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
  const topFade = useRef<HTMLDivElement>(null);
  const bottomFade = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const horizontalRail = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointer: number; y: number; top: number } | null>(null);
  const horizontalDrag = useRef<{
    pointer: number;
    x: number;
    left: number;
  } | null>(null);
  const motion = useRef({ top: 0, time: 0, strength: 0 });
  const motionRaf = useRef(0);
  const wheelScroller = useRef<WheelScroller | null>(null);
  const [near, setNear] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState({ top: 0, max: 0, height: 0, thumb: 0 });
  const [horizontalView, setHorizontalView] = useState({
    left: 0,
    max: 0,
    width: 0,
    thumb: 0,
  });
  const horizontalOverflow = horizontalScrollbar && horizontalView.max > 0;

  function measure() {
    const el = pane.current;
    if (!el || !rail.current) return;
    const style = getComputedStyle(rail.current);
    const available = el.clientHeight;
    const scrollHeight = el.scrollHeight;
    const max = Math.max(0, scrollHeight - available);
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
    // Quantize drawn sizes while keeping native scroll offsets fractional.
    // Drag travel uses these same dimensions, so the handle stays under the pointer.
    const height = Math.round(
      Math.min(
        available,
        railMax,
        available * clamp(railRatio, 0, 1),
        railMin + max * railGrowth,
      ),
    );
    const maxSize =
      parseFloat(style.getPropertyValue("--ui-scroll-area-thumb-max-size")) ||
      height;
    const maxRatio =
      parseFloat(style.getPropertyValue("--ui-scroll-area-thumb-max-ratio")) ||
      1;
    const rawTop = clamp(el.scrollTop, 0, max);
    // Native scroll offsets can be fractional while client/scrollHeight round.
    const top = max - rawTop < 1 ? max : rawTop;
    const thumb = Math.round(
      Math.min(
        height,
        // Keep both drawing and drag travel based on the same capped size.
        // Short rails still retain a usable minimum grab area.
        Math.max(32, Math.min(maxSize, height * clamp(maxRatio, 0, 1))),
        Math.max(32, (height * available) / (scrollHeight || 1)),
      ),
    );
    setView((old) =>
      old.top === top &&
      old.max === max &&
      old.height === height &&
      old.thumb === thumb
        ? old
        : { top, max, height, thumb },
    );
    if (horizontalScrollbar) {
      const availableWidth = el.clientWidth;
      const maxHorizontal = Math.max(0, el.scrollWidth - availableWidth);
      const width = Math.round(
        Math.min(
          availableWidth,
          railMax,
          availableWidth * clamp(railRatio, 0, 1),
          railMin + maxHorizontal * railGrowth,
        ),
      );
      const left = clamp(el.scrollLeft, 0, maxHorizontal);
      const horizontalThumb = Math.round(
        Math.min(
          width,
          Math.max(32, Math.min(maxSize, width * clamp(maxRatio, 0, 1))),
          Math.max(
            32,
            (width * availableWidth) / (maxHorizontal + availableWidth || 1),
          ),
        ),
      );
      setHorizontalView((old) =>
        old.left === left &&
        old.max === maxHorizontal &&
        old.width === width &&
        old.thumb === horizontalThumb
          ? old
          : { left, max: maxHorizontal, width, thumb: horizontalThumb },
      );
    }
    // Paint after all geometry reads, and keep changing values out of content.
    topFade.current?.style.setProperty(
      "--ui-scroll-area-top-hidden",
      `${top}px`,
    );
    bottomFade.current?.style.setProperty(
      "--ui-scroll-area-bottom-hidden",
      `${max - top}px`,
    );
    topFade.current?.style.setProperty(
      "--ui-scroll-area-top-opacity",
      top > 0 ? "1" : "0",
    );
    bottomFade.current?.style.setProperty(
      "--ui-scroll-area-bottom-opacity",
      max > top ? "1" : "0",
    );
  }
  function paintMotion(strength: number) {
    // Extend the edge where content leaves the viewport, without re-rendering
    // the session list on every animation frame.
    topFade.current?.style.setProperty(
      "--ui-scroll-area-top-motion",
      `${Math.max(0, strength)}`,
    );
    bottomFade.current?.style.setProperty(
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
    return () => {
      observer.disconnect();
      cancelAnimationFrame(motionRaf.current);
    };
  }, [horizontalScrollbar]);
  useEffect(() => {
    const tracks = [rail.current, horizontalRail.current];
    const el = pane.current!;
    const remainder = { x: 0, y: 0, left: el.scrollLeft, top: el.scrollTop };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const smoothing = Number.isFinite(wheelSmoothing)
      ? Math.max(0, wheelSmoothing)
      : 70;
    const animator =
      wheelBehavior === "instant"
        ? new WheelScroller(el, () => (reducedMotion.matches ? 0 : smoothing))
        : null;
    wheelScroller.current = animator;
    const interrupt = () => animator?.cancel();
    function nestedScrolls(event: WheelEvent, dx: number, dy: number) {
      for (const target of event.composedPath()) {
        if (target === el) break;
        if (!(target instanceof HTMLElement)) continue;
        const style = getComputedStyle(target);
        const canScroll = (
          delta: number,
          position: number,
          max: number,
          overflow: string,
        ) =>
          delta &&
          /^(auto|scroll)$/.test(overflow) &&
          (delta > 0 ? position < max - 1 : position > 1);
        if (
          canScroll(
            dx,
            target.scrollLeft,
            target.scrollWidth - target.clientWidth,
            style.overflowX,
          ) ||
          canScroll(
            dy,
            target.scrollTop,
            target.scrollHeight - target.clientHeight,
            style.overflowY,
          )
        )
          return true;
      }
      return false;
    }
    function boundaryWheel(event: WheelEvent) {
      if (event.ctrlKey || event.defaultPrevented) return;
      const dx = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
      const dy = event.shiftKey && !event.deltaX ? 0 : event.deltaY;
      if (!dx && !dy) return;
      const computed = getComputedStyle(el);
      const blocked = (
        delta: number,
        position: number,
        max: number,
        policy: string,
      ) =>
        !delta ||
        ((policy === "contain" || policy === "none") &&
          (delta > 0 ? position >= max - 1 : position <= 1));
      if (
        !blocked(
          dx,
          el.scrollLeft,
          el.scrollWidth - el.clientWidth,
          computed.overscrollBehaviorX,
        ) ||
        !blocked(
          dy,
          el.scrollTop,
          el.scrollHeight - el.clientHeight,
          computed.overscrollBehaviorY,
        ) ||
        nestedScrolls(event, dx, dy)
      )
        return;
      // Free-spinning wheels can keep sending input after native smooth
      // scrolling has reached the edge. End that animation at the true native
      // limit rather than starting another clamped scroll animation.
      event.preventDefault();
      el.scrollTo({
        left: dx ? (dx > 0 ? el.scrollWidth : 0) : el.scrollLeft,
        top: dy ? (dy > 0 ? el.scrollHeight : 0) : el.scrollTop,
        behavior: "instant",
      });
    }
    function wheel(event: WheelEvent) {
      const el = pane.current;
      if (!el || event.defaultPrevented) return;
      if (event.ctrlKey) {
        interrupt();
        return;
      }
      const fromViewport = event.currentTarget === el;
      // An existing native gesture can enter from another target after the
      // browser has stopped offering cancelable events. Do not scroll twice.
      if (fromViewport && !event.cancelable) {
        interrupt();
        boundaryWheel(event);
        return;
      }
      const computed = getComputedStyle(el);
      const line = parseFloat(computed.lineHeight) || 16;
      const dx =
        event.deltaX *
        (event.deltaMode === 1
          ? line
          : event.deltaMode === 2
            ? el.clientWidth
            : 1);
      const dy =
        event.deltaY *
        (event.deltaMode === 1
          ? line
          : event.deltaMode === 2
            ? el.clientHeight
            : 1);
      const left = el.scrollLeft;
      const top = el.scrollTop;
      const horizontalDelta = event.shiftKey && !dx ? dy : dx;
      const verticalDelta = event.shiftKey && !dx ? 0 : dy;
      if (
        fromViewport &&
        nestedScrolls(event, horizontalDelta, verticalDelta)
      ) {
        interrupt();
        return;
      }
      const contains = (policy: string) =>
        policy === "contain" || policy === "none";
      const movable = (delta: number, position: number, max: number) =>
        delta > 0 ? position < max - 1 : delta < 0 && position > 1;
      if (animator) {
        const moved = animator.scrollBy(horizontalDelta, verticalDelta);
        if (
          moved ||
          movable(horizontalDelta, left, el.scrollWidth - el.clientWidth) ||
          movable(verticalDelta, top, el.scrollHeight - el.clientHeight) ||
          (horizontalDelta && contains(computed.overscrollBehaviorX)) ||
          (verticalDelta && contains(computed.overscrollBehaviorY))
        )
          event.preventDefault();
        return;
      }
      if (left !== remainder.left || top !== remainder.top)
        remainder.x = remainder.y = 0;
      const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);
      const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
      const targetLeft =
        left + (horizontalDelta ? horizontalDelta + remainder.x : 0);
      const targetTop = top + (verticalDelta ? verticalDelta + remainder.y : 0);
      el.scrollBy({
        left: targetLeft - left,
        top: targetTop - top,
        behavior: "instant",
      });
      // Native offsets can round each move to device pixels. Carry the missed
      // fraction into the next input without retaining pressure past an edge.
      if (horizontalDelta)
        remainder.x =
          targetLeft < 0 || targetLeft > maxLeft
            ? 0
            : targetLeft - el.scrollLeft;
      if (verticalDelta)
        remainder.y =
          targetTop < 0 || targetTop > maxTop ? 0 : targetTop - el.scrollTop;
      remainder.left = el.scrollLeft;
      remainder.top = el.scrollTop;
      // Rails are siblings of the native viewport, so its overscroll policy
      // cannot stop their wheel events from reaching a scrollable ancestor.
      if (
        left !== el.scrollLeft ||
        top !== el.scrollTop ||
        movable(horizontalDelta, left, maxLeft) ||
        movable(verticalDelta, top, maxTop) ||
        (horizontalDelta && contains(computed.overscrollBehaviorX)) ||
        (verticalDelta && contains(computed.overscrollBehaviorY))
      )
        event.preventDefault();
    }
    for (const track of tracks)
      track?.addEventListener("wheel", wheel, { passive: false });
    const viewportWheel = wheelBehavior === "instant" ? wheel : boundaryWheel;
    el.addEventListener("wheel", viewportWheel, { passive: false });
    el.addEventListener("pointerdown", interrupt, { passive: true });
    el.addEventListener("keydown", interrupt);
    el.addEventListener("focusin", interrupt);
    window.addEventListener("blur", interrupt);
    return () => {
      animator?.cancel();
      if (wheelScroller.current === animator) wheelScroller.current = null;
      el.removeEventListener("wheel", viewportWheel);
      el.removeEventListener("pointerdown", interrupt);
      el.removeEventListener("keydown", interrupt);
      el.removeEventListener("focusin", interrupt);
      window.removeEventListener("blur", interrupt);
      for (const track of tracks) track?.removeEventListener("wheel", wheel);
    };
  }, [horizontalOverflow, wheelBehavior, wheelSmoothing]);

  const travel = Math.max(0, view.height - view.thumb);
  const horizontalTravel = Math.max(
    0,
    horizontalView.width - horizontalView.thumb,
  );
  function beginDrag(event: PointerEvent<HTMLDivElement>, horizontal = false) {
    const el = pane.current;
    const range = horizontal ? horizontalView : view;
    const distance = horizontal ? horizontalTravel : travel;
    if (!el || event.button !== 0 || !range.max || !distance) return;
    const track = event.currentTarget;
    const thumb = track.querySelector<HTMLDivElement>('[role="scrollbar"]')!;
    wheelScroller.current?.cancel();
    event.preventDefault();
    thumb.focus({ preventScroll: true });
    if (!thumb.contains(event.target as Node)) {
      const bounds = track.getBoundingClientRect();
      const position = horizontal
        ? event.clientX - bounds.left
        : event.clientY - bounds.top;
      const next =
        (clamp(position - range.thumb / 2, 0, distance) * range.max) / distance;
      if (horizontal) el.scrollLeft = next;
      else el.scrollTop = next;
    }
    track.setPointerCapture(event.pointerId);
    if (horizontal) {
      horizontalDrag.current = {
        pointer: event.pointerId,
        x: event.clientX,
        left: el.scrollLeft,
      };
    } else {
      drag.current = {
        pointer: event.pointerId,
        y: event.clientY,
        top: el.scrollTop,
      };
    }
    setDragging(true);
  }
  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const el = pane.current;
    if (!el) return;
    const vertical = drag.current;
    if (vertical?.pointer === event.pointerId && travel) {
      el.scrollTop =
        vertical.top + ((event.clientY - vertical.y) * view.max) / travel;
    }
    const horizontal = horizontalDrag.current;
    if (horizontal?.pointer === event.pointerId && horizontalTravel) {
      el.scrollLeft =
        horizontal.left +
        ((event.clientX - horizontal.x) * horizontalView.max) /
          horizontalTravel;
    }
  }
  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointer === event.pointerId) drag.current = null;
    if (horizontalDrag.current?.pointer === event.pointerId)
      horizontalDrag.current = null;
    setDragging(!!(drag.current || horizontalDrag.current));
  }
  return (
    <div
      ref={region}
      {...props}
      className={`${styles.area} ${className}`}
      data-scroll-area="root"
      data-scrollbar-offset={offset}
      style={
        {
          "--scrollbar-offset":
            offset === undefined ? undefined : `${offset}px`,
          ...style,
        } as CSSProperties
      }
      data-horizontal-scrollbar={horizontalScrollbar || undefined}
      data-near={near || undefined}
      data-dragging={dragging || undefined}
      data-horizontal-overflow={horizontalOverflow || undefined}
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
        ref={topFade}
        data-scroll-area="top-fade"
        className={`${slot("fade")} ${slot("topFade")}`}
        aria-hidden="true"
      />
      <div
        ref={bottomFade}
        data-scroll-area="bottom-fade"
        className={`${slot("fade")} ${slot("bottomFade")}`}
        aria-hidden="true"
      />
      <div
        ref={rail}
        className={slot("rail")}
        data-scroll-area="rail"
        style={{ height: view.height }}
        onPointerDown={(event) => beginDrag(event)}
        onPointerMove={moveDrag}
        onLostPointerCapture={endDrag}
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
              wheelScroller.current?.cancel();
              event.preventDefault();
              el.scrollTop = next;
            }}
          >
            <span className={slot("handle")} data-scroll-area="handle" />
          </div>
        )}
      </div>
      {horizontalOverflow && (
        <div
          ref={horizontalRail}
          className={slot("horizontalRail")}
          data-scroll-area="horizontal-rail"
          style={{ width: horizontalView.width }}
          onPointerDown={(event) => beginDrag(event, true)}
          onPointerMove={moveDrag}
          onLostPointerCapture={endDrag}
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
              wheelScroller.current?.cancel();
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
