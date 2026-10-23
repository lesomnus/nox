export type TextMotion = "none" | "slide" | "flip";
export type TextDirection = "auto" | "up" | "down";

export type TextMotionOptions = {
  motion?: TextMotion;
  /** Auto moves increasing values down and decreasing values up. */
  direction?: TextDirection;
  /** Transition duration in milliseconds. */
  duration?: number;
  /** Maximum flips per changed character within duration, including the final flip. */
  maxFlipSteps?: number;
  /** Ordered cyclic characters for intermediate flips. Defaults to digits or same-case Latin letters. */
  flipCharacters?: string;
};

const characterGroups = [
  "0123456789",
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "abcdefghijklmnopqrstuvwxyz",
];

/** Sample a bounded path through a cyclic character sequence, always landing on next. */
export function flipPath(
  previous: string,
  next: string,
  direction: "up" | "down",
  maxSteps = 1,
  characters?: string,
): string[] {
  if (previous === next) return [];
  const sequence = Array.from(
    new Set(
      Array.from(
        characters ??
          characterGroups.find(
            (group) => group.includes(previous) && group.includes(next),
          ) ??
          "",
      ),
    ),
  );
  const before = sequence.indexOf(previous);
  const after = sequence.indexOf(next);
  if (before < 0 || after < 0) return [next];
  const sign = direction === "down" ? 1 : -1;
  const distance =
    ((after - before) * sign + sequence.length) % sequence.length;
  const steps = Math.min(
    distance,
    Number.isFinite(maxSteps) ? Math.max(1, Math.floor(maxSteps)) : 1,
  );
  return Array.from({ length: steps }, (_, index) => {
    const offset = Math.ceil((distance * (index + 1)) / steps);
    return sequence[
      (before + sign * offset + sequence.length) % sequence.length
    ];
  });
}

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
