/** Integer sRGB channels, each from 0 to 255. */
export type RgbColor = {
  readonly r: number;
  readonly g: number;
  readonly b: number;
};
export type RgbChannel = keyof RgbColor;
export const rgbChannels = ["r", "g", "b"] as const;

export function rgbByte(value: number) {
  return Number.isFinite(value)
    ? Math.min(255, Math.max(0, Math.round(value)))
    : 0;
}
export function normalizeRgb(value: RgbColor): RgbColor {
  return { r: rgbByte(value.r), g: rgbByte(value.g), b: rgbByte(value.b) };
}
export function sameRgb(a: RgbColor, b: RgbColor) {
  return rgbChannels.every((channel) => a[channel] === b[channel]);
}
export function rgbCss(value: RgbColor) {
  return `rgb(${value.r} ${value.g} ${value.b})`;
}

/** Complete RGB colors only; ordinary single-channel paste remains native. */
export function parseRgb(text: string): RgbColor | undefined {
  const value = text.trim();
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value)?.[1];
  if (hex) {
    const full =
      hex.length === 3 ? [...hex].map((digit) => digit + digit).join("") : hex;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }
  const contents = /^rgb\((.*)\)$/i.exec(value)?.[1] ?? value;
  const parts = contents.includes(",")
    ? contents.split(",").map((part) => part.trim())
    : contents.split(/\s+/);
  if (
    parts.length !== 3 ||
    parts.some((part) => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(part))
  )
    return undefined;
  return normalizeRgb({
    r: Number(parts[0]),
    g: Number(parts[1]),
    b: Number(parts[2]),
  });
}
