import type { HTMLAttributes, ReactNode } from "react";
import { formatOffsetDateTime } from "./date-time-format";
import styles from "./date-time.module.css";

export type DateTimeProps = Omit<
  HTMLAttributes<HTMLTimeElement>,
  "children"
> & {
  value?: Date | number | string | null;
  empty?: ReactNode;
};

export function DateTime({
  value,
  empty = "—",
  className = "",
  ...props
}: DateTimeProps) {
  const date =
    value == null ? undefined : value instanceof Date ? value : new Date(value);
  if (!date || !Number.isFinite(date.getTime())) return <>{empty}</>;
  return (
    <time
      {...props}
      className={`${styles.time} ${className}`}
      dateTime={date.toISOString()}
    >
      {formatOffsetDateTime(date)
        .split(/(\D+)/)
        .map((part, index) =>
          /\D/.test(part) ? (
            <span key={index} className={styles.separator}>
              {part}
            </span>
          ) : (
            part
          ),
        )}
    </time>
  );
}
