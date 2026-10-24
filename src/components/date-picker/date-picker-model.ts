/** Calendar arithmetic uses UTC; values are date-only, never instants. */
export function readDate(value: string | null | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1) return;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  if (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
    return date;
}

export function dateValue(date: Date): string | null {
  const year = date.getUTCFullYear();
  return Number.isFinite(date.getTime()) && year >= 1 && year <= 9999
    ? `${String(year).padStart(4, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
    : null;
}

export const validDate = (value: string | null | undefined) =>
  readDate(value) ? value! : null;
export const monthOf = (value: string) => `${value.slice(0, 7)}-01`;
export function localToday(now = new Date()) {
  return `${String(now.getFullYear()).padStart(4, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function addDays(value: string, count: number): string | null {
  const date = readDate(value);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() + count);
  return dateValue(date);
}
export function addMonths(value: string, count: number): string | null {
  const date = readDate(value);
  if (!date) return null;
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + count);
  const end = new Date(date);
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  date.setUTCDate(Math.min(day, end.getUTCDate()));
  return dateValue(date);
}
export function boundDate(
  value: string,
  min?: string | null,
  max?: string | null,
) {
  return min && value < min ? min : max && value > max ? max : value;
}
export function monthDays(value: string, weekStartsOn: number) {
  const first = readDate(monthOf(value))!;
  const offset = (first.getUTCDay() - weekStartsOn + 7) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first);
    date.setUTCDate(index - offset + 1);
    return dateValue(date);
  });
}
