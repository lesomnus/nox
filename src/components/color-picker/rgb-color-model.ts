/** sRGB byte channels, with optional normalized opacity (defaults to 1). */
export type RgbColor = {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a?: number;
};
export type RgbaColor = RgbColor & { readonly a: number };
export type HsvColor = { h: number; s: number; v: number };
export const rgbChannels = ["r", "g", "b"] as const;
export const unit = (value: number) => Math.max(0, Math.min(1, value));
export function rgbByte(value: number) {
  return Number.isFinite(value)
    ? Math.min(255, Math.max(0, Math.round(value)))
    : 0;
}
export function normalizeRgb(value: RgbColor): RgbaColor {
  return {
    r: rgbByte(value.r),
    g: rgbByte(value.g),
    b: rgbByte(value.b),
    a: value.a === undefined || !Number.isFinite(value.a) ? 1 : unit(value.a),
  };
}
export function sameRgbChannels(a: RgbColor, b: RgbColor) {
  return rgbChannels.every((channel) => a[channel] === b[channel]);
}
export function sameRgb(a: RgbColor, b: RgbColor) {
  return sameRgbChannels(a, b) && (a.a ?? 1) === (b.a ?? 1);
}
export function rgbCss(value: RgbColor) {
  return `rgb(${value.r} ${value.g} ${value.b} / ${value.a ?? 1})`;
}
export function rgbHex(value: RgbColor) {
  return (
    "#" +
    [
      ...rgbChannels.map((key) => value[key]),
      ...(value.a !== undefined && value.a < 1
        ? [Math.round(value.a * 255)]
        : []),
    ]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}
export function rgbToHsv(
  color: RgbColor,
  fallback: HsvColor = { h: 0, s: 0, v: 0 },
): HsvColor {
  const [r, g, b] = rgbChannels.map((key) => rgbByte(color[key]) / 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min;
  let h = fallback.h;
  if (delta)
    h =
      ((max === r
        ? (g - b) / delta
        : max === g
          ? (b - r) / delta + 2
          : (r - g) / delta + 4) *
        60 +
        360) %
      360;
  return { h, s: max === 0 ? fallback.s : delta / max, v: max };
}
export function hsvToRgb({ h, s, v }: HsvColor): RgbaColor {
  const hue = (((h % 360) + 360) % 360) / 60;
  const chroma = unit(v) * unit(s),
    x = chroma * (1 - Math.abs((hue % 2) - 1)),
    m = unit(v) - chroma;
  const [r, g, b] =
    hue < 1
      ? [chroma, x, 0]
      : hue < 2
        ? [x, chroma, 0]
        : hue < 3
          ? [0, chroma, x]
          : hue < 4
            ? [0, x, chroma]
            : hue < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];
  return {
    r: rgbByte((r + m) * 255),
    g: rgbByte((g + m) * 255),
    b: rgbByte((b + m) * 255),
    a: 1,
  };
}

export function parseRgb(text: string): RgbaColor | undefined {
  const value = text.trim();
  const hex = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(value)?.[1];
  if (hex) {
    const full =
      hex.length <= 4 ? [...hex].map((digit) => digit + digit).join("") : hex;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      a: full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1,
    };
  }
  const contents = /^rgba?\((.*)\)$/i.exec(value)?.[1] ?? value;
  const [channels, slashAlpha, ...extra] = contents.split("/");
  if (extra.length) return undefined;
  const parts = channels.includes(",")
    ? channels.split(",").map((part) => part.trim())
    : channels.trim().split(/\s+/);
  const alpha =
    slashAlpha?.trim() ?? (parts.length === 4 ? parts.pop() : undefined);
  if (
    parts.length !== 3 ||
    parts.some((part) => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(part))
  )
    return undefined;
  if (alpha !== undefined && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)%?$/.test(alpha))
    return undefined;
  return normalizeRgb({
    r: Number(parts[0]),
    g: Number(parts[1]),
    b: Number(parts[2]),
    a:
      alpha === undefined
        ? 1
        : parseFloat(alpha) / (alpha.endsWith("%") ? 100 : 1),
  });
}
