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
  /** Animate a background beneath the current tick. Ticks remain decorative. */
  highlight?: boolean;
  /** Override the highlighted value; null hides the highlight. */
  selectedValue?: number | null;
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

// A flat center and a smooth shoulder create a detent without a position jump.
function magneticValue(value: number, min: number, step: number, span: number) {
  const nearest = min + Math.round((value - min) / step) * step;
  const distance = value - nearest;
  const radius = Math.min(step * 0.35, span);
  if (Math.abs(distance) >= radius || radius <= 0) return value;
  const center = radius * 0.25;
  if (Math.abs(distance) <= center) return nearest;
  const t = (Math.abs(distance) - center) / (radius - center);
  const shoulder =
    radius * (3 * t * t - 2 * t * t * t) +
    (radius - center) * (t * t * t - t * t);
  return nearest + Math.sign(distance) * shoulder;
}
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
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  style,
  className = "",
  ...props
}: SliderControlProps) {
  const state = useSlider();
  const locked = state.readOnly || readOnly;
  const pointer = useRef<number | null>(null);
  const grabOffset = useRef(0);
  const [drag, setDrag] = useState<{
    value: number;
    length: number;
    direction: number;
  } | null>(null);
  const blocked = state.disabled || disabled || locked;
  function preview(
    node: HTMLInputElement,
    x: number,
    y: number,
    initial = false,
  ) {
    const rect = node.getBoundingClientRect();
    const css = getComputedStyle(node);
    const thumb = parseFloat(css.getPropertyValue("--slider-thumb-size"));
    const vertical = orientation === "vertical";
    const length = Math.max(1, (vertical ? rect.height : rect.width) - thumb);
    const direction = vertical || css.direction === "rtl" ? -1 : 1;
    const coordinate = vertical ? y - rect.top : x - rect.left;
    if (initial) {
      const fraction = position(state.value, state.min, state.max) / 100;
      const center =
        thumb / 2 + (direction < 0 ? 1 - fraction : fraction) * length;
      grabOffset.current =
        Math.abs(coordinate - center) <= thumb / 2 ? coordinate - center : 0;
    }
    let ratio = (coordinate - grabOffset.current - thumb / 2) / length;
    if (direction < 0) ratio = 1 - ratio;
    const raw =
      state.min + Math.max(0, Math.min(1, ratio)) * (state.max - state.min);
    const value =
      state.step === "any"
        ? raw
        : magneticValue(
            raw,
            state.min,
            state.step,
            (8 * (state.max - state.min)) / length,
          );
    setDrag({
      value: Math.max(state.min, Math.min(state.max, value)),
      length,
      direction,
    });
  }
  function finish() {
    pointer.current = null;
    setDrag(null);
  }
  useEffect(() => {
    if (blocked) finish();
  }, [blocked]);
  const offset = drag
    ? ((drag.value - state.value) / (state.max - state.min)) *
      drag.length *
      drag.direction
    : 0;
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
      data-dragging={drag ? "" : undefined}
      className={`${styles.control} ${className}`}
      style={
        {
          "--slider-progress": `${position(drag?.value ?? state.value, state.min, state.max)}%`,
          "--slider-thumb-offset-x": `${orientation === "horizontal" ? offset : 0}px`,
          "--slider-thumb-offset-y": `${orientation === "vertical" ? offset : 0}px`,
          ...style,
        } as CSSProperties
      }
      onChange={(event) => {
        if (locked || event.currentTarget.matches(":disabled")) return;
        onChange?.(event);
        if (!event.defaultPrevented)
          state.change(event.currentTarget.valueAsNumber);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (blocked || event.currentTarget.matches(":disabled")) {
          event.preventDefault();
          return;
        }
        if (event.defaultPrevented || !event.isPrimary || event.button !== 0)
          return;
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        preview(event.currentTarget, event.clientX, event.clientY, true);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (pointer.current !== event.pointerId || event.defaultPrevented)
          return;
        if (blocked || event.currentTarget.matches(":disabled")) finish();
        else preview(event.currentTarget, event.clientX, event.clientY);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (pointer.current === event.pointerId) finish();
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        if (pointer.current === event.pointerId) finish();
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        if (pointer.current === event.pointerId) finish();
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
      data-value={value}
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
  highlight = false,
  selectedValue,
  className = "",
  style,
  ...props
}: SliderTicksProps) {
  const state = useSlider();
  const selected = selectedValue === undefined ? state.value : selectedValue;
  return (
    <div
      aria-hidden="true"
      {...props}
      data-orientation={orientation}
      data-highlight={highlight || undefined}
      className={`${styles.ticks} ${className}`}
      style={
        {
          "--slider-selected-position": `${position(selected ?? state.min, state.min, state.max)}%`,
          ...style,
        } as CSSProperties
      }
    >
      {highlight && (
        <span
          className={styles.tickHighlight}
          data-hidden={selected === null || undefined}
        />
      )}
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
