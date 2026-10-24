import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  boundDate,
  dateValue,
  localToday,
  monthDays,
  readDate,
  validDate,
} from "./date-picker-model";

describe("date-only calendar values", () => {
  it("rejects impossible dates and instants instead of rolling them into another day", () => {
    for (const value of [
      "2026-02-29",
      "2024-02-30",
      "2026-00-01",
      "2026-13-01",
      "2026-01-00",
      "0000-01-01",
      "2026-1-01",
      "2026-10-24T00:00:00Z",
      "",
      null,
    ])
      expect(validDate(value)).toBeNull();
    for (const value of [
      "2024-02-29",
      "0001-01-01",
      "0099-12-31",
      "9999-12-31",
    ])
      expect(dateValue(readDate(value)!)).toBe(value);
  });
  it("moves across leap days, year boundaries and months with different lengths", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-02-29", 1)).toBe("2024-03-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2024-02-29", 12)).toBe("2025-02-28");
    expect(addMonths("2026-01-31", -1)).toBe("2025-12-31");
    expect(addDays("0001-01-01", -1)).toBeNull();
    expect(addMonths("9999-12-31", 1)).toBeNull();
  });
  it("creates consecutive weeks with the requested first weekday and stable row count", () => {
    const sunday = monthDays("2026-10-01", 0),
      monday = monthDays("2026-10-01", 1);
    expect(sunday).toHaveLength(42);
    expect(monday).toHaveLength(42);
    expect(sunday[0]).toBe("2026-09-27");
    expect(monday[0]).toBe("2026-09-28");
    expect(monday[41]).toBe("2026-11-08");
    expect(new Set(monday).size).toBe(42);
    for (let i = 1; i < monday.length; i++)
      expect(monday[i]).toBe(addDays(monday[i - 1]!, 1));
    expect(monthDays("0001-01-01", 0)[0]).toBeNull();
    expect(monthDays("9999-12-01", 0).at(-1)).toBeNull();
  });
  it("uses local civil time for Today while preserving values across time zones and DST", () => {
    const original = process.env.TZ;
    try {
      for (const zone of ["America/Los_Angeles", "Asia/Seoul"]) {
        process.env.TZ = zone;
        expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
        expect(dateValue(readDate("2026-10-24")!)).toBe("2026-10-24");
        expect(localToday(new Date(2026, 9, 24, 23, 59))).toBe("2026-10-24");
      }
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });
  it("bounds a focused date without changing a valid date inside the range", () => {
    expect(boundDate("2026-10-01", "2026-10-12", "2026-11-06")).toBe(
      "2026-10-12",
    );
    expect(boundDate("2026-12-01", "2026-10-12", "2026-11-06")).toBe(
      "2026-11-06",
    );
    expect(boundDate("2026-10-24", "2026-10-12", "2026-11-06")).toBe(
      "2026-10-24",
    );
  });
});
