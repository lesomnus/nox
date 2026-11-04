import styles from "./compact-number.module.css";
import type { CSSProperties } from "react";
import {
  AnimatedText,
  type TextMotionOptions,
} from "../animated-text/animated-text";

type FormattedNumber = { digits: string; leading: string; unit: string };
export type CompactNumberProps = TextMotionOptions & {
  value: number;
  label?: string;
  muted?: boolean;
  className?: string;
} & (
    | { mode: "integer"; digits?: number; baseUnit?: never }
    | { mode?: "compact"; digits?: never; baseUnit?: string }
  );

const units = [
  [1e-9, "n"],
  [1e-6, "µ"],
  [1e-3, "m"],
  [1, "·"],
  [1e3, "K"],
  [1e6, "M"],
  [1e9, "B"],
  [1e12, "T"],
  [1e15, "P"],
  [1e18, "E"],
] as const;

// Four numeric cells (including the decimal point), followed by one unit cell.
// Fractional units keep small costs visible instead of rounding them to zero.
export function formatCompactNumber(
  value: number,
  mode?: "compact" | "integer",
): FormattedNumber;
export function formatCompactNumber(
  value: number,
  mode: "integer",
  digits: number,
): FormattedNumber;
export function formatCompactNumber(
  value: number,
  mode: "compact" | "integer" = "compact",
  digits = 4,
): FormattedNumber {
  if (mode === "integer" && (!Number.isSafeInteger(digits) || digits < 1))
    throw new RangeError("Integer digits must be a positive safe integer.");
  const cells = mode === "integer" ? digits : 4;
  if (!Number.isFinite(value) || value < 0)
    return {
      digits: "-".repeat(cells),
      leading: "",
      unit: mode === "integer" ? "" : "·",
    };
  if (mode === "integer") {
    const text = String(Math.round(value));
    return text.length > cells
      ? { digits: ">" + "9".repeat(cells - 1), leading: "", unit: "" }
      : { digits: text, leading: "0".repeat(cells - text.length), unit: "" };
  }
  let index = 3;
  if (value > 0) {
    index = 0;
    while (index < units.length - 1 && value >= units[index + 1][0]) index++;
  }
  const scaled = value / units[index][0];
  if (value > 0 && scaled < 0.01)
    return { digits: "<001", leading: "", unit: units[index][1] };
  const decimals =
    index === 3 && Number.isInteger(value)
      ? 0
      : scaled < 10
        ? 2
        : scaled < 100
          ? 1
          : 0;
  const factor = 10 ** decimals;
  const shifted = scaled * factor;
  // Keep the canonical magnitude and three readable significant digits. Do not
  // demote M to K to retain precision or round into a unit the value hasn't reached.
  const truncated = Math.floor(shifted + Number.EPSILON * shifted) / factor;
  const text = truncated.toFixed(decimals);
  if (text.length > 4)
    return { digits: ">999", leading: "", unit: units[index][1] };
  return {
    leading: "0".repeat(4 - text.length),
    digits: text,
    unit: units[index][1],
  };
}

export function CompactNumber(props: CompactNumberProps) {
  const {
    value,
    label,
    mode = "compact",
    muted = false,
    className = "",
    motion = "none",
    animateInitial,
    shouldAnimate,
    direction,
    duration,
    characterDelay,
    maxSlideSteps,
    maxFlipSteps,
    flipEasing,
    flipCharacters,
  } = props;
  const digits = props.mode === "integer" ? (props.digits ?? 4) : 4;
  const number =
    mode === "integer"
      ? formatCompactNumber(value, "integer", digits)
      : formatCompactNumber(value, "compact");
  const unit = number.unit === "·" ? (props.baseUnit ?? "·") : number.unit;
  return (
    <span
      className={`${styles.number} ${className}`.trim()}
      role="img"
      aria-label={label ?? String(value)}
      data-mode={mode}
      data-muted={
        muted || number.digits === "0" || !Number.isFinite(value) || undefined
      }
      style={
        mode === "integer"
          ? ({ "--compact-number-digits": digits } as CSSProperties)
          : undefined
      }
    >
      {motion !== "none" ? (
        <AnimatedText
          aria-hidden="true"
          value={`${number.leading}${number.digits}${unit}`}
          comparisonValue={value}
          motion={motion}
          animateInitial={animateInitial}
          initialValue={
            "-".repeat(digits) +
            (mode === "integer" ? "" : (props.baseUnit ?? "·"))
          }
          placeholderColor="var(--ui-text-separator)"
          shouldAnimate={shouldAnimate}
          direction={direction}
          duration={duration}
          characterDelay={characterDelay}
          maxSlideSteps={maxSlideSteps}
          maxFlipSteps={maxFlipSteps}
          flipEasing={flipEasing}
          flipCharacters={flipCharacters}
          characterClassName={(character, index) =>
            index < number.leading.length
              ? styles.leading
              : index >= number.leading.length + number.digits.length
                ? styles.unit
                : character === "."
                  ? styles.separator
                  : undefined
          }
        />
      ) : (
        <>
          <span className={styles.leading} aria-hidden="true">
            {number.leading}
          </span>
          <span aria-hidden="true">
            {number.digits.split(/(\.)/).map((part, index) =>
              part === "." ? (
                <span key={index} className={styles.separator}>
                  {part}
                </span>
              ) : (
                part
              ),
            )}
          </span>
          {unit && (
            <span className={styles.unit} aria-hidden="true">
              {unit}
            </span>
          )}
        </>
      )}
    </span>
  );
}
