import { describe, expect, it } from "vitest";
import { textDirection } from "./text-motion";

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
