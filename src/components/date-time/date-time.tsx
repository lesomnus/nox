import type { HTMLAttributes, ReactNode } from "react";
import { formatOffsetDateTime } from "./date-time-format";
import styles from "./date-time.module.css";
import {
  AnimatedText,
  type TextMotionOptions,
} from "../animated-text/animated-text";

export type DateTimeProps = Omit<HTMLAttributes<HTMLTimeElement>, "children"> &
  TextMotionOptions & {
    value?: Date | number | string | null;
    /** Custom fallback for missing or invalid values. */
    empty?: ReactNode;
  };

export function DateTime({
  value,
  empty,
  className = "",
  motion = "none",
  direction,
  duration,
  characterDelay,
  maxFlipSteps,
  flipEasing,
  flipCharacters,
  ...props
}: DateTimeProps) {
  const date =
    value == null ? undefined : value instanceof Date ? value : new Date(value);
  const validDate = date && Number.isFinite(date.getTime()) ? date : undefined;
  if (!validDate && empty !== undefined) return <>{empty}</>;
  const text = validDate
    ? formatOffsetDateTime(validDate)
    : "0000-00-00T00:00:00+00:00";
  const content = validDate ? (
    <AnimatedText
      value={text}
      comparisonValue={validDate.getTime()}
      motion={motion}
      direction={direction}
      duration={duration}
      characterDelay={characterDelay}
      maxFlipSteps={maxFlipSteps}
      flipEasing={flipEasing}
      flipCharacters={flipCharacters}
      characterClassName={(character) =>
        /\D/.test(character) ? styles.separator : undefined
      }
    />
  ) : (
    text.split(/(\D+)/).map((part, index) =>
      /\D/.test(part) ? (
        <span key={index} className={styles.separator}>
          {part}
        </span>
      ) : (
        <span key={index}>
          {Array.from(part, (_, digit) => (
            <span key={digit} className={styles.placeholder}>
              {value == null ? "·" : "x"}
            </span>
          ))}
        </span>
      ),
    )
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
