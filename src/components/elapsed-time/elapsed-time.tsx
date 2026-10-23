import styles from "./elapsed-time.module.css";
import { useEffect, useState } from "react";
import {
  AnimatedText,
  type TextMotionOptions,
} from "../animated-text/animated-text";

export type ElapsedTimeProps = TextMotionOptions & {
  startedAt?: number;
  durationMs?: number;
  label: string;
};

export function ElapsedTime({
  startedAt,
  durationMs,
  label,
  motion = "none",
  direction,
  duration,
  characterDelay,
  maxFlipSteps,
  flipCharacters,
}: ElapsedTimeProps) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    // Completed snapshots use the same display without a running interval.
    if (startedAt === undefined || durationMs !== undefined) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt, durationMs]);
  const seconds =
    durationMs !== undefined
      ? Math.max(0, Math.floor(durationMs / 1000))
      : startedAt === undefined
        ? 0
        : Math.max(0, Math.floor((now - startedAt) / 1000));
  const text = [
    Math.floor(seconds / 3600),
    Math.floor(seconds / 60) % 60,
    seconds % 60,
  ]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
  // Keep every digit in place while separating unused leading zeroes/separators.
  const significant = text.search(/[1-9]/);
  const split = significant < 0 ? text.length - 1 : significant;
  return (
    <span
      className={`${styles.elapsed_time} elapsed-time`}
      role={durationMs === undefined ? "timer" : "img"}
      aria-label={label}
      aria-live="off"
    >
      <AnimatedText
        value={text}
        comparisonValue={seconds}
        motion={motion}
        direction={direction}
        duration={duration}
        characterDelay={characterDelay}
        maxFlipSteps={maxFlipSteps}
        flipCharacters={flipCharacters}
        characterClassName={(character, index) =>
          index < split
            ? "elapsed-time-leading"
            : character === ":"
              ? styles.separator
              : undefined
        }
      />
    </span>
  );
}
