import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

type Departure<T> = { item: T; height: number; backs: readonly T[] };

export function useStackPresence<T>(
  items: readonly T[],
  open: boolean,
  front: RefObject<HTMLDivElement | null>,
  getKey: (item: T) => string,
  visibleCount: number,
) {
  const keyOf = (item?: T) => (item === undefined ? null : getKey(item));
  const empty = useRef<readonly T[]>([]).current;
  const visible = open ? items : empty;
  const current = visible[0];
  const [leaving, setLeaving] = useState<Departure<T> | null>(null);
  const [entryDepth, setEntryDepth] = useState(0);
  const [promotionKey, setPromotionKey] = useState<string | null>(null);
  const previous = useRef({ requests: empty, height: 0 });

  useLayoutEffect(() => {
    const before = previous.current;
    const from = before.requests[0];
    if (keyOf(from) !== keyOf(current)) {
      const depth = before.requests.findIndex(
        (event) => keyOf(event) === keyOf(current),
      );
      setEntryDepth(Math.max(0, Math.min(visibleCount - 1, depth)));
      setPromotionKey(depth > 0 ? keyOf(current) : null);
      setLeaving((old) => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
          return null;
        if (from !== undefined)
          return {
            item: from,
            height: before.height,
            backs:
              current !== undefined
                ? empty
                : before.requests.slice(1, visibleCount),
          };
        return keyOf(old?.item) === keyOf(current) ? null : old;
      });
    }
    const snapshot = {
      requests: [...visible],
      height: front.current
        ? parseFloat(getComputedStyle(front.current).height)
        : 0,
    };
    previous.current = snapshot;
    const node = front.current;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      snapshot.height = parseFloat(getComputedStyle(node).height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, current, front, getKey, visibleCount]);

  const finish = (key: string) =>
    setLeaving((old) => (keyOf(old?.item) === key ? null : old));
  const finishPromotion = (key: string) =>
    setPromotionKey((old) => (old === key ? null : old));
  useEffect(() => {
    if (promotionKey === null) return;
    const timer = window.setTimeout(() => finishPromotion(promotionKey), 1000);
    return () => window.clearTimeout(timer);
  }, [promotionKey]);
  useEffect(() => {
    if (!leaving) return;
    // Also remove inert departures if an animation is canceled or motion changes.
    const timer = window.setTimeout(() => finish(getKey(leaving.item)), 1000);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  return {
    current,
    visible,
    leaving,
    entryDepth,
    finish,
    promotionKey,
    finishPromotion,
  };
}
