import numeric from "../compact-number/compact-number.module.css";
import styles from "./duration-display.module.css";
import {
  AnimatedText,
  type TextMotionOptions,
} from "../animated-text/animated-text";

/** Fixed nine-cell day/hour/minute display; ++d means more than 99 days. */
export function formatDurationParts(
  durationMs: number | undefined,
  rounding: "floor" | "ceil" = "floor",
) {
  if (durationMs === undefined || !Number.isFinite(durationMs))
    return ["--", "--", "--"];
  const minutes = Math[rounding](Math.max(0, durationMs) / 60_000);
  if (minutes >= 100 * 1440) return ["++", "--", "--"];
  return [
    Math.floor(minutes / 1440),
    Math.floor(minutes / 60) % 24,
    minutes % 60,
  ].map(String);
}

export function DurationDisplay({
  durationMs,
  rounding = "floor",
  label,
  motion = "none",
  ...motionOptions
}: TextMotionOptions & {
  durationMs?: number;
  rounding?: "floor" | "ceil";
  label?: string;
}) {
  const parts = formatDurationParts(durationMs, rounding);
  const units = ["d", "h", "m"];
  return (
    <span
      className={styles.duration}
      role="img"
      aria-label={
        label ??
        (durationMs === undefined || !Number.isFinite(durationMs)
          ? "Duration unavailable"
          : `${Math.max(0, durationMs)} milliseconds`)
      }
    >
      {parts.map((digits, index) => (
        <span
          key={units[index]}
          className={index === 0 && digits === "0" ? styles.zeroDay : undefined}
          aria-hidden="true"
        >
          {motion !== "none" ? (
            <AnimatedText
              {...motionOptions}
              motion={motion}
              aria-hidden="true"
              value={`${digits.padStart(2, "0")}${units[index]}`}
              initialValue={`--${units[index]}`}
              comparisonValue={durationMs}
              characterClassName={(_character, position) =>
                index === 0 && digits === "0"
                  ? numeric.leading
                  : position === 2
                    ? numeric.unit
                    : position < 2 - digits.length
                      ? numeric.leading
                      : undefined
              }
            />
          ) : (
            <>
              <span className={numeric.leading}>
                {"0".repeat(2 - digits.length)}
              </span>
              <span>{digits}</span>
              <span className={numeric.unit}>{units[index]}</span>
            </>
          )}
        </span>
      ))}
    </span>
  );
}
