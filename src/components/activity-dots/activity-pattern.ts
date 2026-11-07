export const activityDots = [
  [4, 2],
  [8, 2],
  [8, 6],
  [8, 10],
  [8, 14],
  [4, 14],
  [4, 10],
  [4, 6],
] as const;

export function activityPattern(
  seed: number,
  palette: readonly string[] = ["#23b04a", "#2596e9", "#b14ccd"],
) {
  if (!palette.length) palette = ["currentColor"];
  let state = seed;
  const random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const phase = random() * activityDots.length;
  const colors = activityDots.map(
    (_, index) => palette[index % palette.length]!,
  );
  for (let index = colors.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [colors[index], colors[other]] = [colors[other]!, colors[index]!];
  }
  return { seed, phase, colors };
}
