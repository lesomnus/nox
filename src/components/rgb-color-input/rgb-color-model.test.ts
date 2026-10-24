import { describe, expect, it } from "vitest";
import { normalizeRgb, parseRgb } from "./rgb-color-model";

describe("RGB byte input", () => {
  it("rounds and clamps finite values and handles non-finite external channels", () => {
    expect(normalizeRgb({ r: -12, g: 128.7, b: 999 })).toEqual({
      r: 0,
      g: 129,
      b: 255,
    });
    expect(normalizeRgb({ r: NaN, g: Infinity, b: 0 })).toEqual({
      r: 0,
      g: 0,
      b: 0,
    });
  });
  it.each([
    ["#f80", { r: 255, g: 136, b: 0 }],
    [" #12ABef ", { r: 18, g: 171, b: 239 }],
    ["rgb(12, 34, 56)", { r: 12, g: 34, b: 56 }],
    ["rgb(12 34 56)", { r: 12, g: 34, b: 56 }],
    ["12, 34, 56", { r: 12, g: 34, b: 56 }],
    ["999 -10 12.5", { r: 255, g: 0, b: 13 }],
  ])("parses a complete color: %s", (text, expected) =>
    expect(parseRgb(text)).toEqual(expected),
  );
  it.each([
    "",
    "12",
    "12 34",
    "#1234",
    "#12345678",
    "rgba(1,2,3,.5)",
    "rgb(100% 0% 0%)",
    "red",
    "rgb(1,,3)",
    "1 2 Infinity",
  ])(
    "leaves incomplete, alpha and unsupported strings to native input: %s",
    (text) => expect(parseRgb(text)).toBeUndefined(),
  );
});
