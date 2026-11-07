import { expect, test } from "vitest";
import { activityPattern, activityDots } from "./activity-pattern";
test("seed fixes phase and shuffled palette without changing dot geometry", () => {
  expect(activityPattern(42)).toEqual(activityPattern(42));
  expect(activityPattern(42)).not.toEqual(activityPattern(43));
  for (let seed = 0; seed < 32; seed++) {
    const { phase, colors } = activityPattern(seed, ["one", "two", "three"]);
    expect(phase).toBeGreaterThanOrEqual(0);
    expect(phase).toBeLessThan(activityDots.length);
    expect(colors.filter((c) => c === "one")).toHaveLength(3);
    expect(colors.filter((c) => c === "three")).toHaveLength(2);
  }
  expect(activityPattern(0, []).colors).toEqual(Array(8).fill("currentColor"));
});
