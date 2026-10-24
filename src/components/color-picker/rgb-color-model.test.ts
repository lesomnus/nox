import { describe, expect, it } from "vitest";
import { hsvToRgb, normalizeRgb, parseRgb, rgbToHsv } from "./rgb-color-model";

describe("RGB(A) picker model", () => {
  it("normalizes byte channels and optional opacity", () => {
    expect(normalizeRgb({ r: -12, g: 128.7, b: 999 })).toEqual({
      r: 0,
      g: 129,
      b: 255,
      a: 1,
    });
    expect(normalizeRgb({ r: NaN, g: Infinity, b: 0, a: -2 })).toEqual({
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    });
    expect(normalizeRgb({ r: 0, g: 0, b: 0, a: NaN }).a).toBe(1);
  });
  it.each([
    ["#f80", { r: 255, g: 136, b: 0, a: 1 }],
    [" #12ABef ", { r: 18, g: 171, b: 239, a: 1 }],
    ["#1238", { r: 17, g: 34, b: 51, a: 136 / 255 }],
    ["#33669980", { r: 51, g: 102, b: 153, a: 128 / 255 }],
    ["rgb(12, 34, 56)", { r: 12, g: 34, b: 56, a: 1 }],
    ["rgb(12 34 56 / 25%)", { r: 12, g: 34, b: 56, a: 0.25 }],
    ["rgba(12, 34, 56, .4)", { r: 12, g: 34, b: 56, a: 0.4 }],
    ["12, 34, 56", { r: 12, g: 34, b: 56, a: 1 }],
    ["999 -10 12.5", { r: 255, g: 0, b: 13, a: 1 }],
  ])("parses %s", (text, expected) => expect(parseRgb(text)).toEqual(expected));
  it.each([
    "",
    "12",
    "12 34",
    "#12345",
    "rgb(100% 0% 0%)",
    "red",
    "rgb(1,,3)",
    "1 2 Infinity",
    "rgb(1 2 3 / x)",
    "rgb(1 2 3 / .5 / .5)",
  ])("rejects malformed colors: %s", (text) =>
    expect(parseRgb(text)).toBeUndefined(),
  );
  it.each([
    [0, { r: 255, g: 0, b: 0, a: 1 }],
    [60, { r: 255, g: 255, b: 0, a: 1 }],
    [120, { r: 0, g: 255, b: 0, a: 1 }],
    [180, { r: 0, g: 255, b: 255, a: 1 }],
    [240, { r: 0, g: 0, b: 255, a: 1 }],
    [300, { r: 255, g: 0, b: 255, a: 1 }],
    [360, { r: 255, g: 0, b: 0, a: 1 }],
  ])("projects hue %d to a primary/secondary color", (h, expected) =>
    expect(hsvToRgb({ h, s: 1, v: 1 })).toEqual(expected),
  );
  it("preserves latent hue at gray and latent saturation at black", () => {
    expect(
      rgbToHsv({ r: 128, g: 128, b: 128 }, { h: 240, s: 0.8, v: 1 }),
    ).toEqual({ h: 240, s: 0, v: 128 / 255 });
    expect(rgbToHsv({ r: 0, g: 0, b: 0 }, { h: 240, s: 0.8, v: 1 })).toEqual({
      h: 240,
      s: 0.8,
      v: 0,
    });
  });
  it("round-trips sRGB colors through picker coordinates without changing bytes", () => {
    for (const r of [0, 1, 17, 128, 254, 255])
      for (const g of [0, 1, 17, 128, 254, 255])
        for (const b of [0, 1, 17, 128, 254, 255]) {
          expect(hsvToRgb(rgbToHsv({ r, g, b }))).toEqual({ r, g, b, a: 1 });
        }
  });
});
