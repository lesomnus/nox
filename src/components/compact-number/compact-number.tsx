import styles from "./compact-number.module.css";
import type { CSSProperties } from "react";

type FormattedNumber = { digits: string; leading: string; unit: string };
export type CompactNumberProps = {
  value: number;
  label?: string;
  muted?: boolean;
} & (
  | { mode: "integer"; digits?: number }
  | { mode?: "compact"; digits?: never }
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
  let scaled = Number((value / units[index][0]).toPrecision(3));
  if (scaled >= 1000 && index < units.length - 1) {
    index++;
    scaled = Number((value / units[index][0]).toPrecision(3));
  }
  if (value > 0 && scaled < 0.005)
    return { digits: "<001", leading: "", unit: units[index][1] };
  const decimals =
    index === 3 && Number.isInteger(value)
      ? 0
      : scaled < 10
        ? 2
        : scaled < 100
          ? 1
          : 0;
  let text = scaled.toFixed(decimals);
  if (text.length > 4)
    return { digits: ">999", leading: "", unit: units[index][1] };
  // A lower unit can retain four significant digits rather than three. Use it
  // when it fits and actually reduces rounding loss; keep the normal unit on ties.
  if (index > 0) {
    const lower = Math.round(value / units[index - 1][0]);
    if (
      lower > 0 &&
      lower <= 9999 &&
      Math.abs(value - lower * units[index - 1][0]) <
        Math.abs(value - Number(text) * units[index][0])
    ) {
      index--;
      text = String(lower);
    }
  }
  return {
    leading: "0".repeat(4 - text.length),
    digits: text,
    unit: units[index][1],
  };
}

export function CompactNumber(props: CompactNumberProps) {
  const { value, label, mode = "compact", muted = false } = props;
  const digits = props.mode === "integer" ? (props.digits ?? 4) : 4;
  const number =
    mode === "integer"
      ? formatCompactNumber(value, "integer", digits)
      : formatCompactNumber(value, "compact");
  return (
    <span
      className={styles.number}
      role="img"
      aria-label={label ?? String(value)}
      data-mode={mode}
      data-muted={muted || number.digits === "0" || undefined}
      style={
        mode === "integer"
          ? ({ "--compact-number-digits": digits } as CSSProperties)
          : undefined
      }
    >
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
      {number.unit && (
        <span className={styles.unit} aria-hidden="true">
          {number.unit}
        </span>
      )}
    </span>
  );
}
