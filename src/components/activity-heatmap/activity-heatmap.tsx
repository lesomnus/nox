import { useLayoutEffect, useRef } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { useUI } from "../../providers/ui-provider";
import {
  activityHeatmapCells,
  activityHeatmapWeeks,
} from "./activity-heatmap-model";
export {
  activityHeatmapCells,
  activityHeatmapWeeks,
} from "./activity-heatmap-model";
import styles from "./activity-heatmap.module.css";
export type ActivityHeatmapDay = {
  date: string;
  level: number;
  label?: string;
  disabled?: boolean;
};
export type ActivityHeatmapProps<T extends ActivityHeatmapDay> = Omit<
  ComponentPropsWithRef<"section">,
  "onSelect" | "children"
> & {
  days: readonly T[];
  loading?: boolean;
  placeholder?: boolean;
  selectedDate?: string;
  onSelect?: (day: T) => void;
  onWeeksChange?: (weeks: number) => void;
  title?: ReactNode;
  period?: ReactNode;
  weekdays?: readonly ReactNode[];
  legend?: ReactNode;
  moreLabel?: ReactNode;
  legendLabel?: string;
};
export function ActivityHeatmap<T extends ActivityHeatmapDay>({
  days,
  loading = false,
  placeholder = false,
  selectedDate,
  onSelect,
  onWeeksChange,
  title,
  period,
  weekdays,
  legend,
  moreLabel,
  legendLabel,
  className = "",
  ...props
}: ActivityHeatmapProps<T>) {
  const { t, locale } = useUI();
  const weekdayLabels =
    weekdays ??
    Array.from({ length: 7 }, (_, i) =>
      i % 2
        ? new Intl.DateTimeFormat(locale, {
            weekday: "short",
            timeZone: "UTC",
          }).format(new Date(Date.UTC(2024, 0, 7 + i)))
        : "",
    );
  const grid = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = grid.current;
    if (!element) return;
    const measure = () => {
      const style = getComputedStyle(element);
      const size = parseFloat(style.getPropertyValue("--activity-cell-size"));
      const gap = parseFloat(style.rowGap);
      const width = element.getBoundingClientRect().width;
      onWeeksChange?.(activityHeatmapWeeks(width, size, gap));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onWeeksChange]);
  const cells = activityHeatmapCells(days);
  return (
    <section
      {...props}
      className={`${styles.activity} ${className}`}
      aria-label={props["aria-label"] ?? t("Daily activity")}
      aria-busy={loading}
    >
      <div className={styles.header}>
        <span>{title ?? t("Daily activity")}</span>
        {days.length > 0 && (
          <span className={styles.period}>
            {period ?? `${days[0].date} – ${days.at(-1)!.date} · UTC`}
          </span>
        )}
      </div>
      <div className={styles.calendar}>
        <div className={styles.weekdays} aria-hidden="true">
          {weekdayLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
        <div className={styles.days} ref={grid}>
          {cells.map(({ date, day, future }) =>
            day || future ? (
              <div
                key={date}
                className={styles.day}
                data-date={date}
                data-month={date.slice(0, 7)}
                data-month-tone={
                  Number(date.slice(5, 7)) % 2 === 0 ? "soft" : "dim"
                }
              >
                {day && !placeholder ? (
                  <button
                    type="button"
                    className={styles.cell}
                    data-level={Math.max(0, Math.min(4, Math.round(day.level)))}
                    aria-pressed={selectedDate === date}
                    aria-label={day.label ?? date}
                    disabled={day.disabled || !onSelect}
                    onClick={() => onSelect?.(day)}
                  />
                ) : (
                  <span
                    className={styles.cell}
                    data-future={future || undefined}
                    data-placeholder={placeholder || undefined}
                    aria-hidden="true"
                  />
                )}
              </div>
            ) : (
              <span key={date} aria-hidden="true" />
            ),
          )}
        </div>
      </div>
      {legend ?? (
        <div
          className={styles.legend}
          aria-label={legendLabel ?? t("Activity intensity")}
        >
          <span>{t("Less")}</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={styles.cell}
              data-level={level}
              aria-hidden="true"
            />
          ))}
          <span>{moreLabel ?? t("More")}</span>
        </div>
      )}
    </section>
  );
}
