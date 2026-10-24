import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useCallback,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import styles from "./slider.module.css";

export type SliderRootProps = Omit<
  ComponentPropsWithRef<"fieldset">,
  "onChange" | "defaultValue"
> & {
  label: string;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number | "any";
  readOnly?: boolean;
};
export type SliderControlProps = Omit<
  ComponentPropsWithRef<"input">,
  | "type"
  | "value"
  | "defaultValue"
  | "min"
  | "max"
  | "step"
  | "children"
  | "name"
  | "form"
> & { orientation?: "horizontal" | "vertical" };
export type SliderValueProps = ComponentPropsWithRef<"output">;
export type SliderTickProps = ComponentPropsWithRef<"span"> & { value: number };
export type SliderTicksProps = ComponentPropsWithRef<"div"> & {
  values?: readonly (
    | number
    | { value: number; label: ReactNode; title?: string }
  )[];
  orientation?: "horizontal" | "vertical";
};
export type SliderProps = Omit<SliderRootProps, "children"> & {
  orientation?: "horizontal" | "vertical";
};
type State = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number | "any";
  disabled: boolean;
  readOnly: boolean;
  name?: string;
  form?: string;
  description?: string;
  invalid: SliderRootProps["aria-invalid"];
  change: (value: number) => void;
};
const Context = createContext<State | null>(null);
function useSlider() {
  const value = useContext(Context);
  if (!value) throw new Error("Slider parts must be inside SliderRoot.");
  return value;
}
const position = (value: number, min: number, max: number) =>
  Math.max(0, Math.min(100, (100 * (value - min)) / (max - min)));
export function SliderRoot({
  label,
  value,
  defaultValue,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  readOnly = false,
  name,
  form,
  ref,
  className = "",
  ...props
}: SliderRootProps) {
  const lower = Number.isFinite(min) ? min : 0;
  const upper = Number.isFinite(max) && max > lower ? max : lower + 100;
  const increment =
    step === "any" || (Number.isFinite(step) && step > 0) ? step : 1;
  const normalize = (value: number | undefined) =>
    Math.max(lower, Math.min(upper, Number.isFinite(value) ? value! : lower));
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() => normalize(defaultValue));
  const current = normalize(value ?? internal);
  const id = useId();
  const root = useRef<HTMLFieldSetElement | null>(null);
  const attach = useCallback(
    (node: HTMLFieldSetElement | null) => {
      root.current = node;
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    },
    [ref],
  );
  useEffect(() => {
    if (controlled) return;
    const owner = root.current?.form;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (!event.defaultPrevented) setInternal(normalize(defaultValue));
      });
    owner?.addEventListener("reset", reset);
    return () => owner?.removeEventListener("reset", reset);
  }, [controlled, defaultValue, form, lower, upper]);
  function change(value: number) {
    if (disabled || readOnly || root.current?.closest("fieldset[disabled]"))
      return;
    const next = normalize(value);
    if (!controlled) setInternal(next);
    if (current !== next) onChange?.(next);
  }
  return (
    <Context
      value={{
        id,
        label,
        value: current,
        min: lower,
        max: upper,
        step: increment,
        disabled,
        readOnly,
        name,
        form,
        description: props["aria-describedby"],
        invalid: props["aria-invalid"],
        change,
      }}
    >
      <fieldset
        aria-label={label}
        {...props}
        ref={attach}
        form={form}
        disabled={disabled}
        className={`${styles.root} ${className}`}
      />
    </Context>
  );
}
export function SliderControl({
  orientation = "horizontal",
  disabled,
  readOnly,
  onChange,
  style,
  className = "",
  ...props
}: SliderControlProps) {
  const state = useSlider();
  const locked = state.readOnly || readOnly;
  return (
    <input
      {...props}
      type="range"
      id={props.id ?? state.id}
      min={state.min}
      max={state.max}
      step={state.step}
      value={state.value}
      name={state.name}
      form={state.form}
      disabled={state.disabled || disabled}
      readOnly={locked}
      aria-label={props["aria-label"] ?? state.label}
      aria-describedby={
        [state.description, props["aria-describedby"]]
          .filter(Boolean)
          .join(" ") || undefined
      }
      aria-invalid={props["aria-invalid"] ?? state.invalid}
      aria-readonly={locked || undefined}
      aria-orientation={orientation}
      data-orientation={orientation}
      className={`${styles.control} ${className}`}
      style={
        {
          "--slider-progress": `${position(state.value, state.min, state.max)}%`,
          ...style,
        } as CSSProperties
      }
      onChange={(event) => {
        if (locked || event.currentTarget.matches(":disabled")) return;
        onChange?.(event);
        if (!event.defaultPrevented)
          state.change(event.currentTarget.valueAsNumber);
      }}
    />
  );
}
export function SliderValue({
  children,
  className = "",
  ...props
}: SliderValueProps) {
  const state = useSlider();
  return (
    <output
      htmlFor={state.id}
      {...props}
      className={`${styles.value} ${className}`}
    >
      {children ?? state.value}
    </output>
  );
}
export function SliderTick({
  value,
  children,
  className = "",
  style,
  ...props
}: SliderTickProps) {
  const state = useSlider();
  return (
    <span
      {...props}
      className={`${styles.tick} ${className}`}
      style={
        {
          "--slider-tick-position": `${position(value, state.min, state.max)}%`,
          ...style,
        } as CSSProperties
      }
    >
      {children ?? value}
    </span>
  );
}
export function SliderTicks({
  values,
  children,
  orientation = "horizontal",
  className = "",
  ...props
}: SliderTicksProps) {
  useSlider();
  return (
    <div
      aria-hidden="true"
      {...props}
      data-orientation={orientation}
      className={`${styles.ticks} ${className}`}
    >
      {values?.map((entry, i) =>
        typeof entry === "number" ? (
          <SliderTick key={i} value={entry} />
        ) : (
          <SliderTick key={i} value={entry.value} title={entry.title}>
            {entry.label}
          </SliderTick>
        ),
      )}
      {children}
    </div>
  );
}
/** A bare native range; compose Root/Control/Value/Ticks for custom layouts. */
export function Slider({ orientation = "horizontal", ...props }: SliderProps) {
  return (
    <SliderRoot {...props}>
      <SliderControl orientation={orientation} />
    </SliderRoot>
  );
}
