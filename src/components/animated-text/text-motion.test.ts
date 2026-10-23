import { describe, expect, it } from "vitest";
import { flipPath, textDirection } from "./text-motion";

describe("formatted value motion", () => {
  it("follows numeric rather than lexical ordering", () => {
    expect(textDirection("auto", "9", "10")).toBe("down");
    expect(textDirection("auto", "10", "9")).toBe("up");
  });
  it("uses the semantic value when clock fields wrap", () => {
    expect(textDirection("auto", "59", "00", 59, 60)).toBe("down");
    expect(textDirection("auto", "00", "59", 60, 59)).toBe("up");
  });
  it("supports explicit movement independently of value ordering", () => {
    expect(textDirection("up", "1", "2")).toBe("up");
    expect(textDirection("down", "2", "1")).toBe("down");
  });
  it("compares formatted strings naturally without a numeric hint", () => {
    expect(textDirection("auto", "99:59", "100:00")).toBe("down");
  });
});

describe("bounded character flips", () => {
  it("keeps the default as a single direct flip", () => {
    expect(flipPath("A", "Z", "down")).toEqual(["Z"]);
  });
  it("uses distance until the maximum and includes the final landing", () => {
    expect(flipPath("A", "D", "down", 8)).toEqual(["B", "C", "D"]);
    expect(flipPath("A", "Z", "down", 4)).toEqual(["H", "N", "T", "Z"]);
  });
  it("wraps forward for decreasing digits and letters", () => {
    expect(flipPath("9", "1", "down", 8)).toEqual(["0", "1"]);
    expect(flipPath("Z", "B", "down", 8)).toEqual(["A", "B"]);
  });
  it("walks backwards when physical direction is up", () => {
    expect(flipPath("D", "A", "up", 8)).toEqual(["C", "B", "A"]);
    expect(flipPath("0", "8", "up", 8)).toEqual(["9", "8"]);
  });
  it("supports custom Unicode sequences without duplicate cards", () => {
    expect(flipPath("가", "라", "down", 5, "가나다라가")).toEqual([
      "나",
      "다",
      "라",
    ]);
    expect(flipPath("라", "나", "down", 5, "가나다라")).toEqual(["가", "나"]);
  });
  it("falls back for unknown characters and normalizes invalid limits", () => {
    for (const limit of [0, -2, NaN, Infinity, 1.9])
      expect(flipPath("a", "z", "down", limit)).toEqual(["z"]);
    expect(flipPath("가", "나", "down", 8)).toEqual(["나"]);
    expect(flipPath("a", "Z", "down", 8)).toEqual(["Z"]);
    expect(flipPath("A", "D", "down", 8, "")).toEqual(["D"]);
    expect(flipPath("A", "A", "down", 8)).toEqual([]);
  });
});
