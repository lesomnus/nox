import { useEffect, useRef, useState } from "react";
import { useUI } from "../../providers/ui-provider";
import { SliderRoot, SliderControl, SliderTicks } from "../slider/slider";
import styles from "./setting-slider.module.css";

// Position zero unsets the key; its label follows the resolved default/global.
export function SettingSlider({
  label,
  value,
  inherited,
  disabled,
  allowCustomValue = false,
  customMax,
  onChange,
}: {
  label: string;
  value?: number;
  inherited: number;
  disabled?: boolean;
  /** Allow positive integer values beyond the preset ticks. */
  allowCustomValue?: boolean;
  /** Optional upper bound for the custom-value field. */
  customMax?: number;
  onChange: (value: number | undefined) => void;
}) {
  const { t } = useUI();
  const custom =
    value !== undefined && (value > 8 || value < 1 || !Number.isInteger(value));
  const editing = useRef(false);
  const [draft, setDraft] = useState(custom ? String(value) : "");
  useEffect(() => {
    if (!editing.current) setDraft(custom ? String(value) : "");
  }, [value, custom]);
  return (
    <SliderRoot
      label={label}
      min={0}
      max={8}
      step={1}
      value={value === undefined ? 0 : Math.min(value, 8)}
      disabled={disabled}
      onChange={(position) => onChange(position || undefined)}
      className={`${styles.setting_slider} setting-slider`}
      data-muted={value === undefined}
      data-custom={allowCustomValue || custom || undefined}
    >
      <SliderControl
        onPointerUp={(event) => {
          // An arbitrary value is projected onto the last preset. Selecting
          // that same position produces no native change event.
          if (custom && !event.currentTarget.matches(":disabled"))
            onChange(event.currentTarget.valueAsNumber || undefined);
        }}
        onKeyDown={(event) => {
          if (
            custom &&
            !event.currentTarget.matches(":disabled") &&
            ["End", "ArrowRight", "ArrowUp", "PageUp"].includes(event.key)
          ) {
            event.preventDefault();
            onChange(8);
          }
        }}
        aria-valuetext={
          value === undefined
            ? t("Inherited: {value}", { value: inherited })
            : String(value)
        }
      />
      <SliderTicks
        highlight
        selectedValue={custom ? null : (value ?? 0)}
        className={`${styles.ticks} slider-ticks`}
        values={[
          {
            value: 0,
            label: "↺",
            title: `${t("Reset to inherited value")} · ${t("Inherited: {value}", { value: inherited })}`,
          },
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
        ]}
      />
      {(allowCustomValue || custom) && (
        <input
          className={styles.custom}
          type="number"
          inputMode="numeric"
          min={1}
          max={customMax}
          step={1}
          aria-label={t("{label} custom value", { label })}
          placeholder={t("Custom")}
          value={draft}
          disabled={disabled}
          readOnly={!allowCustomValue}
          data-selected={custom || undefined}
          onFocus={() => {
            editing.current = true;
          }}
          onChange={(event) => {
            setDraft(event.currentTarget.value);
            if (
              event.currentTarget.validity.valid &&
              Number.isInteger(event.currentTarget.valueAsNumber)
            )
              onChange(event.currentTarget.valueAsNumber);
          }}
          onBlur={() => {
            editing.current = false;
            setDraft(custom ? String(value) : "");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              event.currentTarget.blur();
            }
          }}
        />
      )}
    </SliderRoot>
  );
}
