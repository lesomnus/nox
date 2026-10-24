import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
} from "react";
import {
  hsvToRgb,
  normalizeRgb,
  parseRgb,
  rgbChannels,
  rgbCss,
  rgbToHsv,
  sameRgb,
  sameRgbChannels,
  unit,
  type HsvColor,
  type RgbColor,
  type RgbaColor,
} from "./rgb-color-model";
import styles from "./color-picker.module.css";

export type { RgbColor, RgbaColor } from "./rgb-color-model";
export type ColorPickerLabels = {
  area: string;
  hue: string;
  alpha: string;
  saturation: string;
  brightness: string;
  instructions: string;
};
export type ColorPickerRootProps = Omit<
  ComponentPropsWithRef<"fieldset">,
  "onChange" | "defaultValue"
> & {
  label: string;
  value?: RgbColor;
  defaultValue?: RgbColor;
  onChange?: (value: RgbaColor) => void;
  readOnly?: boolean;
  labels?: Partial<ColorPickerLabels>;
};
export type ColorPickerProps = Omit<ColorPickerRootProps, "children">;
export type ColorPickerAreaProps = Omit<
  ComponentPropsWithRef<"div">,
  "children"
>;
export type ColorPickerSliderProps = Omit<
  ComponentPropsWithRef<"input">,
  | "children"
  | "type"
  | "min"
  | "max"
  | "step"
  | "value"
  | "defaultValue"
  | "name"
  | "form"
> & {
  /** Horizontal by default; vertical runs from bottom (minimum) to top. */
  orientation?: "horizontal" | "vertical";
};
export type ColorPickerHueProps = ColorPickerSliderProps;
export type ColorPickerOpacityProps = ColorPickerSliderProps;

type PickerContext = {
  color: RgbaColor;
  selection: HsvColor;
  labels: ColorPickerLabels;
  disabled: boolean;
  readOnly: boolean;
  invalid: ColorPickerRootProps["aria-invalid"];
  describedBy: string | undefined;
  blocked: () => boolean;
  publish: (color: RgbColor) => void;
  select: (color: HsvColor) => void;
};
const Context = createContext<PickerContext | null>(null);
function usePicker() {
  const context = useContext(Context);
  if (!context)
    throw new Error("ColorPicker parts must be inside ColorPickerRoot.");
  return context;
}
const describe = (...ids: (string | undefined)[]) =>
  ids.filter(Boolean).join(" ") || undefined;

const black: RgbaColor = { r: 0, g: 0, b: 0, a: 1 };
const defaultLabels: ColorPickerLabels = {
  area: "Color field",
  hue: "Hue",
  alpha: "Opacity",
  saturation: "Saturation",
  brightness: "Brightness",
  instructions:
    "Use Left and Right for saturation, Up and Down for brightness. Hold Shift for larger steps. Home selects white; End selects black.",
};
const percent = (number: number) => `${Math.round(number * 1000) / 10}%`;

/** Shared RGB(A) state, accessible group, paste handling and form integration. No imposed layout. */
export function ColorPickerRoot({
  label,
  value,
  defaultValue = black,
  onChange,
  readOnly = false,
  labels: customLabels,
  disabled = false,
  children,
  name,
  form,
  className = "",
  onPaste,
  ...props
}: ColorPickerRootProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() => normalizeRgb(defaultValue));
  const color = normalizeRgb(value ?? internal);
  const [selection, setSelection] = useState(() => rgbToHsv(color));
  const labels = { ...defaultLabels, ...customLabels };
  const root = useRef<HTMLFieldSetElement | null>(null);
  const { ref, ...attributes } = props;
  const attach = useCallback(
    (node: HTMLFieldSetElement | null) => {
      root.current = node;
      if (typeof ref === "function") {
        const cleanup = ref(node);
        if (typeof cleanup === "function")
          return () => {
            root.current = null;
            cleanup();
          };
      } else if (ref) ref.current = node;
    },
    [ref],
  );
  useLayoutEffect(() => {
    // Retain exact picker coordinates (and latent hue/saturation at gray/black)
    // when the RGB projection matches, but follow caller-owned RGB replacements.
    setSelection((current) =>
      sameRgbChannels(hsvToRgb(current), color)
        ? current
        : rgbToHsv(color, current),
    );
  }, [color.r, color.g, color.b, selection.h, selection.s, selection.v]);
  useEffect(() => {
    if (controlled) return;
    const owner = root.current?.form;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        const next = normalizeRgb(defaultValue);
        setInternal(next);
        setSelection(rgbToHsv(next));
      });
    owner?.addEventListener("reset", reset);
    return () => owner?.removeEventListener("reset", reset);
  }, [controlled, defaultValue, form]);
  const blocked = () =>
    !!(disabled || readOnly || root.current?.closest("fieldset[disabled]"));
  function publish(next: RgbColor) {
    const normalized = normalizeRgb(next);
    if (blocked() || sameRgb(color, normalized)) return;
    if (!controlled) setInternal(normalized);
    onChange?.(normalized);
  }
  function select(next: HsvColor) {
    if (blocked()) return;
    const position = {
      h: Math.max(0, Math.min(360, next.h)),
      s: unit(next.s),
      v: unit(next.v),
    };
    setSelection(position);
    publish({ ...hsvToRgb(position), a: color.a });
  }
  return (
    <Context
      value={{
        color,
        selection,
        labels,
        disabled,
        readOnly,
        invalid: props["aria-invalid"],
        describedBy: props["aria-describedby"],
        blocked,
        publish,
        select,
      }}
    >
      <fieldset
        aria-label={label}
        {...attributes}
        ref={attach}
        name={name}
        form={form}
        disabled={disabled}
        className={`${styles.root} ${className}`}
        data-readonly={readOnly || undefined}
        data-invalid={
          props["aria-invalid"] === true ||
          props["aria-invalid"] === "true" ||
          undefined
        }
        onPaste={(event) => {
          onPaste?.(event);
          if (event.defaultPrevented || blocked()) return;
          const next = parseRgb(event.clipboardData.getData("text/plain"));
          if (next) {
            event.preventDefault();
            publish(next);
          }
        }}
      >
        {children}
        {name &&
          [...rgbChannels, "a" as const].map((channel) => (
            <input
              key={channel}
              type="hidden"
              name={`${name}.${channel}`}
              value={color[channel]}
              form={form}
            />
          ))}
      </fieldset>
    </Context>
  );
}

/** Saturation/brightness plane; accepts native div props, styles, events and ref. */
export function ColorPickerArea({
  className = "",
  style,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  onKeyDown,
  ...props
}: ColorPickerAreaProps) {
  const {
    color,
    selection,
    labels,
    disabled,
    readOnly,
    invalid,
    describedBy,
    blocked,
    select,
  } = usePicker();
  const id = useId();
  const pointer = useRef<number | null>(null);
  const description = describe(
    props["aria-describedby"],
    describedBy,
    `${id}-position`,
    `${id}-instructions`,
  );
  const unavailable = (element: HTMLElement) =>
    blocked() || !!element.closest("fieldset[disabled]");
  function point(element: HTMLElement, x: number, y: number) {
    if (unavailable(element)) return;
    const bounds = element.getBoundingClientRect();
    if (bounds.width && bounds.height)
      select({
        ...selection,
        s: unit((x - bounds.left) / bounds.width),
        v: 1 - unit((y - bounds.top) / bounds.height),
      });
  }
  return (
    <div
      {...props}
      className={`${styles.plane} ${className}`}
      role={props.role ?? "group"}
      aria-label={props["aria-label"] ?? labels.area}
      aria-describedby={description}
      aria-disabled={disabled || props["aria-disabled"]}
      tabIndex={disabled ? -1 : (props.tabIndex ?? 0)}
      style={{ backgroundColor: `hsl(${selection.h} 100% 50%)`, ...style }}
      data-color-picker="plane"
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (
          event.defaultPrevented ||
          unavailable(event.currentTarget) ||
          !event.isPrimary ||
          event.button !== 0
        )
          return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        pointer.current = event.pointerId;
        point(event.currentTarget, event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!event.defaultPrevented && pointer.current === event.pointerId)
          point(event.currentTarget, event.clientX, event.clientY);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (pointer.current === event.pointerId) {
          if (!event.defaultPrevented)
            point(event.currentTarget, event.clientX, event.clientY);
          pointer.current = null;
        }
      }}
      onPointerCancel={(event) => {
        pointer.current = null;
        onPointerCancel?.(event);
      }}
      onLostPointerCapture={(event) => {
        pointer.current = null;
        onLostPointerCapture?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          event.target !== event.currentTarget ||
          unavailable(event.currentTarget)
        )
          return;
        const step = event.shiftKey ? 0.1 : 0.01;
        const next = { ...selection };
        if (event.key === "ArrowLeft") next.s -= step;
        else if (event.key === "ArrowRight") next.s += step;
        else if (event.key === "ArrowUp") next.v += step;
        else if (event.key === "ArrowDown") next.v -= step;
        else if (event.key === "Home") {
          next.s = 0;
          next.v = 1;
        } else if (event.key === "End") {
          next.s = 1;
          next.v = 0;
        } else return;
        event.preventDefault();
        select(next);
      }}
    >
      <span
        className={styles.marker}
        aria-hidden="true"
        style={{
          left: percent(selection.s),
          top: percent(1 - selection.v),
          backgroundColor: rgbCss({ ...color, a: 1 }),
        }}
        data-color-picker="marker"
      />
      {(
        [
          ["s", labels.saturation],
          ["v", labels.brightness],
        ] as const
      ).map(([key, label]) => (
        <input
          key={key}
          className={styles.srOnly}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={selection[key]}
          tabIndex={-1}
          disabled={disabled}
          aria-readonly={readOnly || undefined}
          aria-invalid={invalid}
          aria-describedby={describe(props["aria-describedby"], describedBy)}
          aria-label={label}
          aria-valuetext={percent(selection[key])}
          onChange={(event) => {
            if (!unavailable(event.currentTarget))
              select({
                ...selection,
                [key]: Number(event.currentTarget.value),
              });
          }}
        />
      ))}
      <span id={`${id}-instructions`} className={styles.srOnly}>
        {labels.instructions}
      </span>
      <output
        id={`${id}-position`}
        className={styles.srOnly}
        aria-live="polite"
      >
        {labels.saturation} {percent(selection.s)}, {labels.brightness}{" "}
        {percent(selection.v)}
      </output>
    </div>
  );
}

function PickerSlider({
  channel,
  orientation = "horizontal",
  className = "",
  disabled,
  readOnly,
  style,
  onChange,
  ...props
}: ColorPickerSliderProps & { channel: "hue" | "alpha" }) {
  const picker = usePicker();
  const hue = channel === "hue";
  const locked = picker.readOnly || readOnly;
  return (
    <input
      {...props}
      type="range"
      className={`${styles.slider} ${hue ? styles.hue : styles.alpha} ${className}`}
      data-orientation={orientation}
      aria-orientation={orientation}
      min={0}
      max={hue ? 360 : 1}
      step={hue ? 1 : 0.001}
      value={hue ? picker.selection.h : picker.color.a}
      disabled={picker.disabled || disabled}
      readOnly={locked}
      aria-readonly={locked || undefined}
      aria-invalid={props["aria-invalid"] ?? picker.invalid}
      aria-describedby={describe(props["aria-describedby"], picker.describedBy)}
      aria-label={
        props["aria-label"] ?? (hue ? picker.labels.hue : picker.labels.alpha)
      }
      aria-valuetext={
        hue ? `${Math.round(picker.selection.h)}°` : percent(picker.color.a)
      }
      style={
        {
          ...(!hue && {
            "--color-picker-opaque": rgbCss({ ...picker.color, a: 1 }),
            "--color-picker-transparent": rgbCss({ ...picker.color, a: 0 }),
          }),
          ...style,
        } as CSSProperties
      }
      onChange={(event) => {
        if (
          locked ||
          picker.blocked() ||
          event.currentTarget.matches(":disabled")
        )
          return;
        onChange?.(event);
        if (event.defaultPrevented) return;
        const value = Number(event.currentTarget.value);
        if (hue) picker.select({ ...picker.selection, h: value });
        else picker.publish({ ...picker.color, a: value });
      }}
    />
  );
}

export function ColorPickerHue(props: ColorPickerHueProps) {
  return <PickerSlider {...props} channel="hue" />;
}
export function ColorPickerOpacity(props: ColorPickerOpacityProps) {
  return <PickerSlider {...props} channel="alpha" />;
}

/** Default layout: plane on the left, vertical hue and opacity rails on the right. */
export function ColorPicker({ className = "", ...props }: ColorPickerProps) {
  return (
    <ColorPickerRoot {...props} className={`${styles.control} ${className}`}>
      <ColorPickerArea />
      <div className={styles.sliders}>
        <ColorPickerHue orientation="vertical" />
        <ColorPickerOpacity orientation="vertical" />
      </div>
    </ColorPickerRoot>
  );
}
