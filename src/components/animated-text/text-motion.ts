export type TextMotion = "none" | "slide" | "flip";
export type TextDirection = "auto" | "up" | "down";

export type TextCharacterDelayContext = {
  character: string;
  previousCharacter: string;
  /** Position in the complete new text, measured in Unicode code points. */
  index: number;
  length: number;
  /** Position among changed, animated characters only. */
  changedIndex: number;
  changedCount: number;
  text: string;
  previousText: string;
};

/** A stagger interval, or a callback returning an absolute start delay in ms. */
export type TextCharacterDelay =
  | number
  | ((context: TextCharacterDelayContext) => number);

export type TextMotionOptions = {
  motion?: TextMotion;
  /** Auto moves increasing values down and decreasing values up. */
  direction?: TextDirection;
  /** Each character's transition duration in milliseconds, excluding its start delay. */
  duration?: number;
  /** Stagger changed characters by this interval, or compute each start delay in ms. */
  characterDelay?: TextCharacterDelay;
  /** Maximum flips per changed character within duration, including the final flip. */
  maxFlipSteps?: number;
  /** Ordered cyclic characters for intermediate flips. Defaults to digits or same-case Latin letters. */
  flipCharacters?: string;
};

export function isFlipCharacter(
  character: string,
  characters?: string,
): boolean {
  return /[\p{L}\p{N}]/u.test(character) || !!characters?.includes(character);
}

/** Evaluate once per update so random callbacks remain stable throughout a transition. */
export function characterDelays(
  previousText: string,
  text: string,
  motion: TextMotion,
  delay: TextCharacterDelay = 0,
  flipCharacters?: string,
): number[] {
  const previous = Array.from(previousText);
  const next = Array.from(text);
  const changed = next.flatMap((character, index) =>
    motion !== "none" &&
    previous[index] !== undefined &&
    previous[index] !== character &&
    (motion === "slide" || isFlipCharacter(character, flipCharacters))
      ? [index]
      : [],
  );
  const delays = next.map(() => 0);
  changed.forEach((index, changedIndex) => {
    const milliseconds =
      typeof delay === "number"
        ? delay * changedIndex
        : delay({
            character: next[index],
            previousCharacter: previous[index],
            index,
            length: next.length,
            changedIndex,
            changedCount: changed.length,
            text,
            previousText,
          });
    delays[index] = Number.isFinite(milliseconds)
      ? Math.max(0, milliseconds)
      : 0;
  });
  return delays;
}

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
