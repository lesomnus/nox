import type { HTMLAttributes, ReactNode } from "react";
import { formatOffsetDateTime } from "./date-time-format";
import styles from "./date-time.module.css";

export type DateTimeProps = Omit<
  HTMLAttributes<HTMLTimeElement>,
  "children"
> & {
  value?: Date | number | string | null;
  /** Custom fallback for missing or invalid values. */
  empty?: ReactNode;
};

export function DateTime({
  value,
  empty,
  className = "",
  ...props
}: DateTimeProps) {
  const date =
    value == null ? undefined : value instanceof Date ? value : new Date(value);
  const validDate = date && Number.isFinite(date.getTime()) ? date : undefined;
  if (!validDate && empty !== undefined) return <>{empty}</>;
  const text = validDate
    ? formatOffsetDateTime(validDate)
    : "0000-00-00T00:00:00+00:00";
  const content = text.split(/(\D+)/).map((part, index) =>
    /\D/.test(part) ? (
      <span key={index} className={styles.separator}>
        {part}
      </span>
    ) : validDate ? (
      part
    ) : (
      <span key={index}>
        {Array.from(part, (_, digit) => (
          <span key={digit} className={styles.placeholder}>
            {value == null ? "·" : "x"}
          </span>
        ))}
      </span>
    ),
  );
  if (!validDate)
    return (
      <span
        {...props}
        className={`${styles.time} ${className}`}
        role={props.role ?? "img"}
        aria-label={
          props["aria-label"] ??
          (value == null ? "Date unavailable" : "Invalid date")
        }
      >
        {content}
      </span>
    );
  return (
    <time
      {...props}
      className={`${styles.time} ${className}`}
      dateTime={validDate.toISOString()}
    >
      {content}
    </time>
  );
}
