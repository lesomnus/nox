import { describe, expect, it } from "vitest";
import {
  containsDate,
  dateGroup,
  dateWeekSelection,
  dateWindowSelection,
  emptySelection,
  groupRange,
  hasSelection,
  normalizeSelection,
  orderedRange,
  rangeAvailable,
  sameSelection,
  selectDates,
  selectionComplete,
  selectionStart,
  type DatePickerSelectionContext,
} from "./date-picker-selection";

const context: DatePickerSelectionContext = {
  mode: "multiple",
  value: [],
  weekStartsOn: 1,
};
describe("date selection modes", () => {
  it("normalizes each mode independently and copies/sorts unique date sets", () => {
    const dates = ["2026-10-24", "bad", "2026-10-21", "2026-10-24"];
    const result = normalizeSelection("multiple", dates);
    expect(result).toEqual({
      mode: "multiple",
      value: ["2026-10-21", "2026-10-24"],
    });
    expect(dates).toHaveLength(4);
    expect(normalizeSelection("single", dates)).toEqual({
      mode: "single",
      value: null,
    });
    expect(
      normalizeSelection("range", { start: "2026-10-24", end: "2026-10-21" }),
    ).toEqual({
      mode: "range",
      value: { start: "2026-10-21", end: "2026-10-24" },
    });
    expect(
      normalizeSelection("range", { start: "bad", end: "2026-10-21" }),
    ).toEqual({ mode: "range", value: null });
  });
  it("toggles a whole date group while retaining dates outside it", () => {
    const selected = normalizeSelection("multiple", [
      "2026-10-01",
      "2026-10-24",
    ]);
    const group = ["2026-10-23", "2026-10-24", "2026-10-25"];
    const added = selectDates(selected, "2026-10-24", group)!;
    expect(added).toEqual({
      mode: "multiple",
      value: ["2026-10-01", ...group],
    });
    expect(selectDates(added, "2026-10-24", group)).toEqual({
      mode: "multiple",
      value: ["2026-10-01"],
    });
    expect(containsDate(added, "2026-10-25")).toBe(true);
    expect(selectionStart(added)).toBe("2026-10-01");
  });
  it("starts and completes ranges in either direction, then starts a new range", () => {
    const first = selectDates(emptySelection("range"), "2026-10-24")!;
    expect(first).toEqual({
      mode: "range",
      value: { start: "2026-10-24", end: null },
    });
    expect(selectionComplete(first)).toBe(false);
    expect(containsDate(first, "2026-10-25")).toBe(false);
    const end = selectDates(first, "2026-10-21")!;
    expect(end).toEqual({
      mode: "range",
      value: { start: "2026-10-21", end: "2026-10-24" },
    });
    expect(containsDate(end, "2026-10-22")).toBe(true);
    expect(containsDate(end, "2026-10-25")).toBe(false);
    expect(selectDates(end, "2026-11-01")).toEqual({
      mode: "range",
      value: { start: "2026-11-01", end: null },
    });
    expect(selectDates(first, "2026-10-24")).toEqual({
      mode: "range",
      value: { start: "2026-10-24", end: "2026-10-24" },
    });
  });
  it("rejects invalid/empty groups and requires contiguous groups for range mode", () => {
    expect(dateGroup([])).toBeNull();
    expect(dateGroup(null)).toBeNull();
    expect(dateGroup(new Array(3))).toBeNull();
    expect(dateGroup(["2026-02-30"])).toBeNull();
    expect(dateGroup(["2026-10-24", "2026-10-23", "2026-10-24"])).toEqual([
      "2026-10-23",
      "2026-10-24",
    ]);
    expect(groupRange(["2026-10-23", "2026-10-25"])).toBeNull();
    expect(
      selectDates(emptySelection("range"), "2026-10-24", [
        "2026-10-23",
        "2026-10-25",
      ]),
    ).toBeNull();
    expect(
      selectDates(emptySelection("range"), "2026-10-24", [
        "2026-10-23",
        "2026-10-24",
        "2026-10-25",
      ]),
    ).toEqual({
      mode: "range",
      value: { start: "2026-10-23", end: "2026-10-25" },
    });
  });
  it("checks unavailable interior dates without building a date array, and stops at the first failure", () => {
    const visited: string[] = [];
    expect(
      rangeAvailable(orderedRange("2026-10-21", "2026-10-28"), (date) => {
        visited.push(date);
        return date !== "2026-10-26";
      }),
    ).toBe(false);
    expect(visited.at(-1)).toBe("2026-10-26");
    expect(visited).not.toContain("2026-10-27");
    expect(rangeAvailable({ start: "0001-01-01", end: "9999-12-31" })).toBe(
      true,
    );
    expect(rangeAvailable({ start: "2026-10-21", end: null })).toBe(false);
  });
  it("clears each mode without confusing an empty array, null range and pending range", () => {
    for (const mode of ["single", "multiple", "range"] as const) {
      const empty = emptySelection(mode);
      expect(hasSelection(empty)).toBe(false);
      expect(selectionStart(empty)).toBeNull();
      expect(selectionComplete(empty)).toBe(true);
      expect(sameSelection(empty, normalizeSelection(mode, undefined))).toBe(
        true,
      );
    }
    expect(
      sameSelection(
        emptySelection("range"),
        selectDates(emptySelection("range"), "2026-10-24")!,
      ),
    ).toBe(false);
  });
});
describe("selection presets", () => {
  it("returns three-day and asymmetric windows across leap days and year boundaries", () => {
    expect(dateWindowSelection()("2024-02-29", context)).toEqual([
      "2024-02-28",
      "2024-02-29",
      "2024-03-01",
    ]);
    expect(
      dateWindowSelection({ before: 0, after: 2 })("2026-12-31", context),
    ).toEqual(["2026-12-31", "2027-01-01", "2027-01-02"]);
    expect(dateWindowSelection()("0001-01-01", context)).toBeNull();
    expect(dateWindowSelection()("9999-12-31", context)).toBeNull();
    expect(() => dateWindowSelection({ before: -1 })).toThrow(RangeError);
    expect(() => dateWindowSelection({ after: 0.5 })).toThrow(RangeError);
  });
  it("uses the caller's week start for either selection mode", () => {
    const monday = dateWeekSelection("2026-10-24", context)!;
    expect(monday).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
    ]);
    const sunday = dateWeekSelection("2026-10-24", {
      mode: "range",
      value: null,
      weekStartsOn: 0,
    })!;
    expect(sunday[0]).toBe("2026-10-18");
    expect(sunday.at(-1)).toBe("2026-10-24");
    expect(groupRange(monday)).toEqual({
      start: "2026-10-19",
      end: "2026-10-25",
    });
  });
});
