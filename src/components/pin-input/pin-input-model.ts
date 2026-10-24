export type PinInputMode = "numeric" | "alphanumeric";

export function pinInputGroups(length: number, groups?: readonly number[]) {
  const sizes = groups ? [...groups] : [length];
  if (
    !sizes.length ||
    sizes.some((size) => !Number.isSafeInteger(size) || size < 1)
  )
    throw new RangeError(
      "PinInput length and group sizes must be positive integers.",
    );
  return sizes;
}

export function normalizePin(
  value: string,
  mode: PinInputMode,
  length: number,
) {
  return value
    .normalize("NFKC")
    .replace(mode === "numeric" ? /[^0-9]/g : /[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, length);
}

export function pastePin(
  value: string,
  text: string,
  start: number,
  end: number,
  mode: PinInputMode,
  length: number,
) {
  const pasted = normalizePin(text, mode, length);
  if (!pasted) return null;
  if (pasted.length === length) return { value: pasted, cursor: length };
  return {
    value: (value.slice(0, start) + pasted + value.slice(end)).slice(0, length),
    cursor: Math.min(start + pasted.length, length),
  };
}
