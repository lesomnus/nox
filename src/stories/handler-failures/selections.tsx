import { useId } from "react";
import {
  Checkbox,
  IconValueMenu,
  PrefixValueMenu,
  Radio,
  SegmentedControl,
  Switch,
  ToggleButton,
  ValueMenu,
} from "@lesomnus/nox";
import { Example, useCommit } from "./shared";
import styles from "./examples.module.css";

export type SelectionKind =
  | "switch"
  | "toggle"
  | "checkbox"
  | "radio"
  | "segments"
  | "value-menu"
  | "prefix-menu"
  | "icon-menu";
const titles: Record<SelectionKind, string> = {
  switch: "Switch",
  toggle: "ToggleButton",
  checkbox: "Checkbox",
  radio: "Radio",
  segments: "SegmentedControl",
  "value-menu": "ValueMenu",
  "prefix-menu": "PrefixValueMenu",
  "icon-menu": "IconValueMenu",
};
const options = [
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
];

export function SelectionFailureExample({
  kind = "switch",
  showRetry = false,
  awaitAction = false,
  searchable = false,
  alignItemWithTrigger = false,
}: {
  kind?: SelectionKind;
  showRetry?: boolean;
  awaitAction?: boolean;
  searchable?: boolean;
  alignItemWithTrigger?: boolean;
}) {
  const state = useCommit("low", showRetry);
  const name = useId();
  const binary = (checked: boolean) => state.change(checked ? "high" : "low");
  const menuProps = {
    label: "Quality",
    value: state.value,
    choose: awaitAction ? state.commit : state.change,
    awaitAction,
    searchable,
    alignItemWithTrigger,
    options,
    disabled: state.pending,
  };
  return (
    <Example title={titles[kind]}>
      <div
        ref={state.controlRef}
        className={styles.row}
        role="group"
        aria-label="Quality setting"
        aria-describedby={state.description}
        aria-busy={state.pending}
      >
        {kind === "switch" && (
          <Switch
            label="High quality"
            checked={state.value === "high"}
            pending={state.pending}
            onChange={binary}
          />
        )}
        {kind === "toggle" && (
          <ToggleButton
            pressed={state.value === "high"}
            loading={state.pending}
            onPressedChange={binary}
          >
            High quality
          </ToggleButton>
        )}
        {kind === "checkbox" && (
          <label>
            <Checkbox
              checked={state.value === "high"}
              disabled={state.pending}
              onChange={(event) => binary(event.currentTarget.checked)}
              aria-invalid={!!state.error}
              aria-describedby={state.description}
            />
            High quality
          </label>
        )}
        {kind === "radio" &&
          options.map((option) => (
            <label key={option.value}>
              <Radio
                name={name}
                value={option.value}
                checked={state.value === option.value}
                disabled={state.pending}
                onChange={() => state.change(option.value)}
                aria-describedby={state.description}
              />
              {option.label}
            </label>
          ))}
        {kind === "segments" && (
          <SegmentedControl
            label="Quality"
            value={state.value}
            options={options}
            disabled={state.pending}
            onChange={state.change}
          />
        )}
        {kind === "value-menu" && <ValueMenu {...menuProps} />}
        {kind === "prefix-menu" && (
          <PrefixValueMenu {...menuProps} prefix="Quality" />
        )}
        {kind === "icon-menu" && (
          <IconValueMenu {...menuProps} icon={<span>Q</span>} />
        )}
      </div>
      {state.feedback}
      <output aria-label="Saved value">{state.value}</output>
    </Example>
  );
}
