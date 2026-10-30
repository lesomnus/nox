import { addDays, dateValue, readDate, validDate } from "./date-picker-model";

export type DatePickerMode = "single" | "multiple" | "range";
export type DatePickerRange = { start: string; end: string | null };
export type DatePickerSelection =
  | { mode: "single"; value: string | null }
  | { mode: "multiple"; value: readonly string[] }
  | { mode: "range"; value: DatePickerRange | null };
export type DatePickerSelectionContext = DatePickerSelection & {
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};
export type DatePickerSelectionResolver = (
  date: string,
  context: DatePickerSelectionContext,
) => readonly string[] | null;

export type DatePickerSelectionProps =
  | {
      mode?: "single";
      value?: string | null;
      defaultValue?: string | null;
      onChange?: (value: string | null) => unknown;
      getSelectionDates?: never;
    }
  | {
      mode: "multiple";
      value?: readonly string[];
      defaultValue?: readonly string[];
      onChange?: (value: string[]) => unknown;
      getSelectionDates?: DatePickerSelectionResolver;
    }
  | {
      mode: "range";
      value?: DatePickerRange | null;
      defaultValue?: DatePickerRange | null;
      onChange?: (value: DatePickerRange | null) => unknown;
      getSelectionDates?: DatePickerSelectionResolver;
    };

export const uniqueDates = (dates: readonly string[]) =>
  [...new Set(dates)].sort();

export function normalizeSelection(
  mode: DatePickerMode,
  value: unknown,
): DatePickerSelection {
  if (mode === "multiple")
    return {
      mode,
      value: uniqueDates(
        Array.isArray(value)
          ? value.filter(
              (date): date is string =>
                typeof date === "string" && !!validDate(date),
            )
          : [],
      ),
    };
  if (mode === "range") {
    if (
      !value ||
      typeof value !== "object" ||
      !("start" in value) ||
      typeof value.start !== "string" ||
      !validDate(value.start)
    )
      return { mode, value: null };
    const end =
      "end" in value && typeof value.end === "string"
        ? validDate(value.end)
        : null;
    return {
      mode,
      value:
        end && end < value.start
          ? { start: end, end: value.start }
          : { start: value.start, end },
    };
  }
  return { mode, value: typeof value === "string" ? validDate(value) : null };
}
export const emptySelection = (mode: DatePickerMode) =>
  normalizeSelection(mode, null);
export const selectionStart = (selection: DatePickerSelection) =>
  selection.mode === "multiple"
    ? (selection.value[0] ?? null)
    : selection.mode === "range"
      ? (selection.value?.start ?? null)
      : selection.value;
export const hasSelection = (selection: DatePickerSelection) =>
  !!selectionStart(selection);
export const selectionComplete = (selection: DatePickerSelection) =>
  selection.mode !== "range" || !selection.value || !!selection.value.end;
export function containsDate(selection: DatePickerSelection, date: string) {
  return selection.mode === "multiple"
    ? selection.value.includes(date)
    : selection.mode === "range"
      ? !!selection.value &&
        date >= selection.value.start &&
        date <= (selection.value.end ?? selection.value.start)
      : selection.value === date;
}
export const sameSelection = (a: DatePickerSelection, b: DatePickerSelection) =>
  JSON.stringify(a) === JSON.stringify(b);

export function dateGroup(dates: readonly string[] | null): string[] | null {
  if (!dates?.length) return null;
  for (const date of dates)
    if (typeof date !== "string" || !validDate(date)) return null;
  return uniqueDates(dates);
}
export function groupRange(dates: readonly string[]): DatePickerRange | null {
  if (
    !dates.length ||
    dates.some((date, i) => i > 0 && addDays(dates[i - 1], 1) !== date)
  )
    return null;
  return { start: dates[0], end: dates[dates.length - 1] };
}
export function orderedRange(a: string, b: string): DatePickerRange {
  return a < b ? { start: a, end: b } : { start: b, end: a };
}
/** Scan a committed range without allocating an array of all its dates. */
export function rangeAvailable(
  range: DatePickerRange,
  available?: (date: string) => boolean,
) {
  if (!range.end) return false;
  if (!available) return true;
  const day = readDate(range.start)!;
  const end = readDate(range.end)!;
  while (day <= end) {
    if (!available(dateValue(day)!)) return false;
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return true;
}

/** Apply a validated group; range groups must be contiguous and are committed in one click. */
export function selectDates(
  selection: DatePickerSelection,
  clicked: string,
  group?: readonly string[],
): DatePickerSelection | null {
  if (selection.mode === "single") return { mode: "single", value: clicked };
  if (selection.mode === "multiple") {
    const dates = group ?? [clicked];
    const remove = dates.every((date) => selection.value.includes(date));
    return {
      mode: "multiple",
      value: remove
        ? selection.value.filter((date) => !dates.includes(date))
        : uniqueDates([...selection.value, ...dates]),
    };
  }
  if (group) {
    const range = groupRange(group);
    return range ? { mode: "range", value: range } : null;
  }
  return {
    mode: "range",
    value:
      selection.value && !selection.value.end
        ? orderedRange(selection.value.start, clicked)
        : { start: clicked, end: null },
  };
}

/** A symmetric or asymmetric window, inclusive of the clicked date. */
export function dateWindowSelection({
  before = 1,
  after = 1,
}: { before?: number; after?: number } = {}): DatePickerSelectionResolver {
  if (
    ![before, after].every((value) => Number.isSafeInteger(value) && value >= 0)
  )
    throw new RangeError("Date window offsets must be nonnegative integers");
  return (date) => {
    const start = addDays(date, -before),
      end = addDays(date, after);
    if (!start || !end) return null;
    return Array.from(
      { length: before + after + 1 },
      (_, i) => addDays(start, i)!,
    );
  };
}
/** The full week containing the clicked date, using the picker's week start. */
export const dateWeekSelection: DatePickerSelectionResolver = (
  date,
  context,
) => {
  const day = readDate(date);
  if (!day) return null;
  const before = (day.getUTCDay() - context.weekStartsOn + 7) % 7;
  return dateWindowSelection({ before, after: 6 - before })(date, context);
};
