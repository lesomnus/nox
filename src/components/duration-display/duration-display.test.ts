import { describe, expect, it } from "vitest";
import { formatDurationParts } from "./duration-display";
describe("duration parts", () => {
  it("uses days, hours and minutes without rounding countdowns down early", () => {
    expect(formatDurationParts((6 * 1440 + 23 * 60 + 59) * 60_000)).toEqual([
      "6",
      "23",
      "59",
    ]);
    expect(formatDurationParts(1, "ceil")).toEqual(["0", "0", "1"]);
    expect(formatDurationParts(1)).toEqual(["0", "0", "0"]);
    expect(formatDurationParts(-1)).toEqual(["0", "0", "0"]);
  });
  it("keeps missing and overflowing values within nine cells", () => {
    expect(formatDurationParts(undefined)).toEqual(["--", "--", "--"]);
    expect(formatDurationParts(Infinity)).toEqual(["--", "--", "--"]);
    expect(formatDurationParts(100 * 86400_000)).toEqual(["++", "--", "--"]);
  });
});
