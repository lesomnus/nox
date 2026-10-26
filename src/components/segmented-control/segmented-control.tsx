import styles from "./segmented-control.module.css";
import { useId, type CSSProperties } from "react";
import type { ValueOption } from "../value-menu/value-menu";

// Native radios provide arrow-key navigation; equal grid cells keep the
// sliding selection indicator independent of text length.
export type SegmentedControlProps = {
  label: string;
  value: string;
  options: ValueOption[];
  disabled?: boolean;
  /** Compact controls fit a 24px toolbar row. */
  size?: "default" | "compact";
  /** Show option icons while retaining their labels for accessibility/tooltips. */
  iconOnly?: boolean;
  onChange: (value: string) => void;
};

export function SegmentedControl({
  label,
  value,
  options,
  disabled,
  size = "default",
  iconOnly = false,
  onChange,
}: SegmentedControlProps) {
  const name = useId();
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  return (
    <div
      className={`${styles.segmented_control} segmented-control`}
      role="radiogroup"
      aria-label={label}
      data-value={value}
      data-size={size}
      style={
        {
          "--segment-count": options.length,
          "--segment-index": index,
        } as CSSProperties
      }
    >
      <span className="segment-indicator" aria-hidden="true" />
      {options.map((option) => (
        <label
          key={option.value}
          className="segment"
          data-muted={!!option.muted}
          title={option.label}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            aria-label={option.label}
            disabled={disabled || option.disabled}
            onChange={() => onChange(option.value)}
          />
          <span>
            {option.icon && <span aria-hidden="true">{option.icon}</span>}
            {(!iconOnly || !option.icon) && option.label}
          </span>
        </label>
      ))}
    </div>
  );
}
