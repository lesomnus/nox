export type TextMotion = "none" | "slide" | "flip";
export type TextDirection = "auto" | "up" | "down";

export type TextMotionOptions = {
  motion?: TextMotion;
  /** Auto moves increasing values down and decreasing values up. */
  direction?: TextDirection;
  /** Transition duration in milliseconds. */
  duration?: number;
};

export function textDirection(
  direction: TextDirection,
  previous: string,
  next: string,
  previousOrder?: number,
  nextOrder?: number,
): "up" | "down" {
  if (direction !== "auto") return direction;
  const before = previousOrder ?? Number(previous);
  const after = nextOrder ?? Number(next);
  const difference =
    Number.isFinite(before) && Number.isFinite(after)
      ? after - before
      : next.localeCompare(previous, undefined, { numeric: true });
  return difference < 0 ? "up" : "down";
}
