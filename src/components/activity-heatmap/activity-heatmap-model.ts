const dayMs = 86400000;
export function activityHeatmapWeeks(width: number, size: number, gap: number) {
  const cell = Number.isFinite(size) && size > 0 ? size : 12;
  const space = Number.isFinite(gap) && gap >= 0 ? gap : 0;
  return Number.isFinite(width)
    ? Math.max(1, Math.min(52, Math.floor((width + space) / (cell + space))))
    : 1;
}
/** UTC ISO dates avoid local daylight-saving shifts. Duplicate dates use the last entry. */
export function activityHeatmapCells<T extends { date: string }>(
  days: readonly T[],
) {
  const valid = days.filter(
    (day) =>
      /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
      Number.isFinite(Date.parse(day.date)) &&
      new Date(day.date).toISOString().slice(0, 10) === day.date,
  );
  if (!valid.length) return [];
  const byDate = new Map(valid.map((day) => [day.date, day]));
  const dates = [...byDate.keys()].sort();
  const from = Date.parse(dates[0]);
  const end = Date.parse(dates.at(-1)!);
  const start = from - new Date(from).getUTCDay() * dayMs;
  const count = Math.ceil(((end - start) / dayMs + 1) / 7) * 7;
  return Array.from({ length: count }, (_, index) => {
    const time = start + index * dayMs;
    const date = new Date(time).toISOString().slice(0, 10);
    return {
      date,
      day: byDate.get(date),
      future: time > end,
      recorded: time >= from && time <= end,
    };
  });
}
