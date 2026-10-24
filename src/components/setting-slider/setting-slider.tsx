import { useUI } from "../../providers/ui-provider";
import {
  SliderRoot,
  SliderControl,
  SliderValue,
  SliderTicks,
} from "../slider/slider";
import styles from "./setting-slider.module.css";

// Position zero unsets the key; its label follows the resolved default/global.
export function SettingSlider({
  label,
  value,
  inherited,
  disabled,
  onChange,
}: {
  label: string;
  value?: number;
  inherited: number;
  disabled?: boolean;
  onChange: (value: number | undefined) => void;
}) {
  const { t } = useUI();
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
    >
      <SliderValue>{value ?? inherited}</SliderValue>
      <SliderControl
        aria-valuetext={
          value === undefined
            ? t("Inherited: {value}", { value: inherited })
            : String(value)
        }
      />
      <SliderTicks
        className={`${styles.ticks} slider-ticks`}
        values={[
          { value: 0, label: "↺", title: t("Reset to inherited value") },
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
    </SliderRoot>
  );
}
