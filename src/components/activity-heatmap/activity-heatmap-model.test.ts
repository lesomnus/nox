import { expect, test } from "vitest";
import {
  activityHeatmapCells,
  activityHeatmapWeeks,
} from "./activity-heatmap-model";
test("sparse UTC days are placed by date and padded to complete weeks", () => {
  const days = [
    { date: "2026-03-10", level: 3 },
    { date: "2026-03-07", level: 1 },
  ];
  const cells = activityHeatmapCells(days);
  expect(cells).toHaveLength(14);
  expect(cells[0].date).toBe("2026-03-01");
  expect(cells.find((cell) => cell.date === "2026-03-07")?.day).toBe(days[1]);
  expect(cells.find((cell) => cell.date === "2026-03-08")?.day).toBeUndefined();
  expect(cells.at(-1)?.future).toBe(true);
});
test("invalid dates are omitted, repeated dates use their last value", () => {
  expect(
    activityHeatmapCells([{ date: "2026-02-30" }, { date: "bad" }]),
  ).toEqual([]);
  const cells = activityHeatmapCells([
    { date: "2026-01-01", level: 1 },
    { date: "2026-01-01", level: 4 },
  ]);
  expect(cells.find((c) => c.day)?.day?.level).toBe(4);
});
test("responsive week count is bounded and handles hidden layout", () => {
  expect(activityHeatmapWeeks(0, 12, 4)).toBe(1);
  expect(activityHeatmapWeeks(156, 12, 4)).toBe(10);
  expect(activityHeatmapWeeks(10000, 12, 4)).toBe(52);
  expect(activityHeatmapWeeks(NaN, NaN, NaN)).toBe(1);
});
