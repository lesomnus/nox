import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatOffsetDateTime,
  formatRelativeDateTime,
} from "./date-time-format";

afterEach(() => vi.restoreAllMocks());

describe("local timestamps with numeric offsets", () => {
  it.each([
    [0, "+00:00"],
    [-540, "+09:00"],
    [-330, "+05:30"],
    [-345, "+05:45"],
    [210, "-03:30"],
    [300, "-05:00"],
  ])(
    "preserves timezone offset %s including fractional hours",
    (offset, suffix) => {
      const date = new Date(2026, 9, 20, 2, 38, 19);
      vi.spyOn(date, "getTimezoneOffset").mockReturnValue(offset);
      expect(formatOffsetDateTime(date)).toBe(`2026-10-20T02:38:19${suffix}`);
    },
  );
  it("pads local calendar and clock fields", () => {
    const date = new Date(2026, 0, 2, 3, 4, 5);
    vi.spyOn(date, "getTimezoneOffset").mockReturnValue(0);
    expect(formatOffsetDateTime(date)).toBe("2026-01-02T03:04:05+00:00");
  });
});

describe("compact relative times", () => {
  const now = Date.parse("2026-11-07T12:00:00Z");
  it.each([
    [0, "now"],
    [-59_000, "now"],
    [-60_000, "1m ago"],
    [-5 * 60_000, "5m ago"],
    [-2 * 3_600_000, "2h ago"],
    [-86_400_000, "1d ago"],
    [-7 * 86_400_000, "1w ago"],
    [-30 * 86_400_000, "1mo ago"],
    [-365 * 86_400_000, "1y ago"],
    [2 * 3_600_000, "in 2h"],
  ])("formats offset %s as %s", (offset, expected) => {
    expect(
      formatRelativeDateTime(new Date(now + offset), "en", now, {
        compact: true,
      }),
    ).toBe(expected);
  });
  it("keeps existing long formatting and honors the caller's locale", () => {
    const date = new Date(now - 5 * 60_000);
    expect(formatRelativeDateTime(date, "en", now)).toBe("5 minutes ago");
    expect(formatRelativeDateTime(date, "ko", now, { compact: true })).toBe(
      "5분 전",
    );
    expect(formatRelativeDateTime(new Date(now - 86_400_000), "en", now)).toBe(
      "yesterday",
    );
  });
});
