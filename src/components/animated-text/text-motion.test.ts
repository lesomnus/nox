import { describe, expect, it } from "vitest";
import { characterDelays, flipPath, textDirection } from "./text-motion";

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

describe("character start delays", () => {
  it("staggers only changed animated characters, without gaps for static positions", () => {
    expect(characterDelays("12:34", "12:56", "flip", 80)).toEqual([
      0, 0, 0, 0, 80,
    ]);
    expect(characterDelays("ABCD", "WXYZ", "slide", 100)).toEqual([
      0, 100, 200, 300,
    ]);
  });
  it("provides Unicode positions, previous values and compact change indices", () => {
    const contexts: unknown[] = [];
    expect(
      characterDelays("😀A:B", "😀C:D", "flip", (context) => {
        contexts.push(context);
        return context.changedIndex * 70 + 10;
      }),
    ).toEqual([0, 10, 0, 80]);
    expect(contexts).toEqual([
      {
        character: "C",
        previousCharacter: "A",
        index: 1,
        length: 4,
        changedIndex: 0,
        changedCount: 2,
        text: "😀C:D",
        previousText: "😀A:B",
      },
      {
        character: "D",
        previousCharacter: "B",
        index: 3,
        length: 4,
        changedIndex: 1,
        changedCount: 2,
        text: "😀C:D",
        previousText: "😀A:B",
      },
    ]);
  });
  it("evaluates callbacks only for animated changes, once per character", () => {
    let calls = 0;
    const delay = () => ++calls * 20;
    expect(characterDelays("A-", "B!C", "flip", delay)).toEqual([20, 0, 0]);
    expect(calls).toBe(1);
    expect(characterDelays("A-", "B!C", "none", delay)).toEqual([0, 0, 0]);
    expect(calls).toBe(1);
    expect(characterDelays("A-", "B!C", "flip", delay, "-!")).toEqual([
      40, 60, 0,
    ]);
    expect(calls).toBe(3);
  });
  it("normalizes negative, non-finite and missing delays", () => {
    for (const delay of [-100, NaN, Infinity])
      expect(characterDelays("AA", "BB", "slide", delay)).toEqual([0, 0]);
    expect(
      characterDelays(
        "AAA",
        "BBB",
        "slide",
        ({ index }) => [-1, Infinity, 25.5][index],
      ),
    ).toEqual([0, 0, 25.5]);
    expect(characterDelays("AA", "BB", "slide")).toEqual([0, 0]);
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
