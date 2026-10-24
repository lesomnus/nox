import { describe, expect, it } from "vitest";
import { normalizePin, pastePin, pinInputGroups } from "./pin-input-model";

describe("code normalization and groups", () => {
  it("supports arbitrary groups and rejects invalid slot counts", () => {
    expect(pinInputGroups(6)).toEqual([6]);
    expect(pinInputGroups(6, [4, 4])).toEqual([4, 4]);
    for (const sizes of [[], [0], [-1], [2.5], [NaN]])
      expect(() => pinInputGroups(6, sizes)).toThrow(RangeError);
  });
  it("accepts formatted codes, fullwidth digits and uppercase Latin device codes", () => {
    expect(normalizePin("１２３-４５６", "numeric", 6)).toBe("123456");
    expect(normalizePin("ab12-cd34", "alphanumeric", 8)).toBe("AB12CD34");
    expect(normalizePin(" 1!a2🙂3 45", "numeric", 4)).toBe("1234");
    expect(normalizePin("éßabC", "alphanumeric", 8)).toBe("ABC");
  });
  it("replaces the whole code on full-code paste from any slot", () => {
    expect(pastePin("123456", "65-43-21", 3, 4, "numeric", 6)).toEqual({
      value: "654321",
      cursor: 6,
    });
  });
  it("replaces a selected range on partial paste and ignores incompatible text", () => {
    expect(pastePin("AB12CD34", "xy", 2, 4, "alphanumeric", 8)).toEqual({
      value: "ABXYCD34",
      cursor: 4,
    });
    expect(pastePin("12", "abc", 2, 2, "numeric", 6)).toBeNull();
  });
});
