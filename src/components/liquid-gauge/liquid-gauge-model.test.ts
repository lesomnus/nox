import { expect, test } from "vitest";
import { liquidEmptyContour } from "./liquid-gauge-model";
test("remaining amount clamps to a finite closed contour with rounded shoulders", () => {
  for (const value of [undefined, 0, 1, 10, 50, 90, 99, 100]) {
    const path = liquidEmptyContour(value);
    expect(path).not.toMatch(/NaN|Infinity/);
    expect(path).toMatch(/^M 15 0/);
    expect(path).toMatch(/Z$/);
    expect(path.match(/C /g)).toHaveLength(4);
  }
  expect(liquidEmptyContour(-20)).toBe(liquidEmptyContour(0));
  expect(liquidEmptyContour(120)).toBe(liquidEmptyContour(100));
});
