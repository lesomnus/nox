import type { Ref } from "react";
import type { DatePickerSelection } from "./date-picker-selection";
export function DateSelectionFields({
  selected,
  name,
  form,
  disabled,
  ref,
}: {
  selected: DatePickerSelection;
  name?: string;
  form?: string;
  disabled?: boolean;
  ref?: Ref<HTMLInputElement>;
}) {
  const mode = selected.mode;
  return (
    <>
      <input
        ref={ref}
        type="hidden"
        name={mode === "single" ? name : undefined}
        form={form}
        value={selected.mode === "single" ? (selected.value ?? "") : ""}
        disabled={disabled}
      />
      {selected.mode === "multiple" &&
        selected.value.map((date) => (
          <input
            key={date}
            type="hidden"
            name={name}
            form={form}
            value={date}
            disabled={disabled}
          />
        ))}
      {selected.mode === "range" && (
        <>
          <input
            type="hidden"
            name={name ? `${name}.start` : undefined}
            form={form}
            value={selected.value?.start ?? ""}
            disabled={disabled}
          />
          <input
            type="hidden"
            name={name ? `${name}.end` : undefined}
            form={form}
            value={selected.value?.end ?? ""}
            disabled={disabled}
          />
        </>
      )}
    </>
  );
}
