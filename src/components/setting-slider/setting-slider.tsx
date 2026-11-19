import { useEffect, useRef, useState } from "react";
import { useUI } from "../../providers/ui-provider";
import {
  SliderRoot,
  SliderControl,
  SliderTick,
  SliderTicks,
} from "../slider/slider";
import styles from "./setting-slider.module.css";

const isPreset = (value: number | undefined) =>
  value === undefined || (Number.isInteger(value) && value >= 1 && value <= 8);

// Position zero inherits; the final position selects the remembered custom value.
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
  const outsidePresets = !isPreset(value);
  const [customValue, setCustomValue] = useState(
    outsidePresets ? value : undefined,
  );
  const customValueRef = useRef(customValue);
  const [selection, setSelection] = useState({ value, custom: outsidePresets });
  const pendingValues = useRef<(number | undefined)[]>([]);
  const custom = selection.value === value ? selection.custom : outsidePresets;
  const hasCustom =
    allowCustomValue || outsidePresets || customValue !== undefined;
  const editing = useRef(false);
  const [draft, setDraft] = useState(outsidePresets ? String(value) : "");
  useEffect(() => {
    // A controlled parent may echo the focus change and the typed value in
    // separate renders. Neither echo should replace the newer local selection.
    const echoed = pendingValues.current.lastIndexOf(value);
    if (echoed >= 0) {
      pendingValues.current.splice(0, echoed + 1);
      return;
    }
    pendingValues.current = [];
    setSelection((current) =>
      current.value === value ? current : { value, custom: outsidePresets },
    );
    if (outsidePresets && !editing.current) {
      customValueRef.current = value;
      setCustomValue(value);
      setDraft(String(value));
    }
  }, [value, outsidePresets]);
  function select(next: number | undefined, custom: boolean) {
    setSelection({ value: next, custom });
    const pending = pendingValues.current;
    if ((pending.length ? pending.at(-1) : value) === next) return;
    pending.push(next);
    onChange(next);
  }
  function chooseCustom(
    next = customValueRef.current ?? value ?? inherited,
    updateDraft = true,
  ) {
    customValueRef.current = next;
    setCustomValue(next);
    if (updateDraft) setDraft(String(next));
    select(next, true);
  }
  function choose(position: number) {
    if (position === 9) chooseCustom();
    else select(position || undefined, false);
  }
  return (
    <SliderRoot
      label={label}
      min={0}
      max={hasCustom ? 9 : 8}
      step={1}
      value={custom ? 9 : (value ?? 0)}
      disabled={disabled}
      onChange={choose}
      className={`${styles.setting_slider} setting-slider`}
      data-muted={value === undefined}
      data-custom={hasCustom || undefined}
    >
      <SliderControl
        className={styles.control}
        aria-valuetext={
          value === undefined
            ? t("Inherited: {value}", { value: inherited })
            : String(value)
        }
      />
      <SliderTicks
        highlight
        selectable
        marks
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
      >
        {hasCustom && (
          <SliderTick value={9} selectable={false}>
            <input
              className={styles.custom}
              type="number"
              inputMode="numeric"
              min={1}
              max={customMax}
              step={1}
              aria-label={t("{label} custom value", { label })}
              value={draft}
              disabled={disabled}
              readOnly={!allowCustomValue}
              data-selected={custom || undefined}
              onFocus={() => {
                editing.current = true;
                if (customValueRef.current !== undefined)
                  chooseCustom(customValueRef.current);
              }}
              onChange={(event) => {
                setDraft(event.currentTarget.value);
                if (
                  event.currentTarget.validity.valid &&
                  Number.isInteger(event.currentTarget.valueAsNumber)
                )
                  chooseCustom(event.currentTarget.valueAsNumber, false);
              }}
              onBlur={() => {
                editing.current = false;
                setDraft(
                  customValueRef.current === undefined
                    ? ""
                    : String(customValueRef.current),
                );
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "Escape") {
                  event.preventDefault();
                  if (event.key === "Escape") event.stopPropagation();
                  event.currentTarget.blur();
                }
              }}
            />
          </SliderTick>
        )}
      </SliderTicks>
    </SliderRoot>
  );
}
