import {
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
export type ColorPickerProps = Omit<
  ComponentPropsWithRef<"fieldset">,
  "children" | "onChange" | "defaultValue"
> & {
  label: string;
  value?: RgbColor;
  defaultValue?: RgbColor;
  onChange?: (value: RgbaColor) => void;
  readOnly?: boolean;
  labels?: Partial<ColorPickerLabels>;
};
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

/** A saturation/brightness plane, hue spectrum and opacity rail; values are RGB(A). */
export function ColorPicker({
  label,
  value,
  defaultValue = black,
  onChange,
  readOnly = false,
  labels: customLabels,
  disabled,
  name,
  form,
  className = "",
  onPaste,
  ...props
}: ColorPickerProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() => normalizeRgb(defaultValue));
  const color = normalizeRgb(value ?? internal);
  const [selection, setSelection] = useState(() => rgbToHsv(color));
  const labels = { ...defaultLabels, ...customLabels };
  const id = useId();
  const root = useRef<HTMLFieldSetElement | null>(null);
  const pointer = useRef<number | null>(null);
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
  function point(element: HTMLElement, x: number, y: number) {
    const bounds = element.getBoundingClientRect();
    if (bounds.width && bounds.height)
      select({
        ...selection,
        s: unit((x - bounds.left) / bounds.width),
        v: 1 - unit((y - bounds.top) / bounds.height),
      });
  }
  const description = [
    props["aria-describedby"],
    `${id}-position`,
    `${id}-instructions`,
  ]
    .filter(Boolean)
    .join(" ");
  const rangeProps = {
    disabled,
    "aria-readonly": readOnly || undefined,
    "aria-invalid": props["aria-invalid"],
    "aria-describedby": props["aria-describedby"],
  };
  return (
    <fieldset
      aria-label={label}
      {...attributes}
      ref={attach}
      name={name}
      form={form}
      disabled={disabled}
      className={`${styles.control} ${className}`}
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
      <div
        className={styles.plane}
        role="group"
        aria-label={labels.area}
        aria-describedby={description}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        style={{ backgroundColor: `hsl(${selection.h} 100% 50%)` }}
        data-color-picker="plane"
        onPointerDown={(event) => {
          if (blocked() || !event.isPrimary || event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          pointer.current = event.pointerId;
          point(event.currentTarget, event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (pointer.current === event.pointerId)
            point(event.currentTarget, event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          if (pointer.current === event.pointerId) {
            point(event.currentTarget, event.clientX, event.clientY);
            pointer.current = null;
          }
        }}
        onPointerCancel={() => {
          pointer.current = null;
        }}
        onLostPointerCapture={() => {
          pointer.current = null;
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || blocked()) return;
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
        ).map(([key, channelLabel]) => (
          <input
            key={key}
            {...rangeProps}
            className={styles.srOnly}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={selection[key]}
            tabIndex={-1}
            aria-label={channelLabel}
            aria-valuetext={percent(selection[key])}
            onChange={(event) =>
              select({ ...selection, [key]: Number(event.currentTarget.value) })
            }
          />
        ))}
      </div>
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
      <div className={styles.sliders}>
        <input
          {...rangeProps}
          className={`${styles.slider} ${styles.hue}`}
          type="range"
          aria-orientation="vertical"
          min={0}
          max={360}
          step={1}
          value={selection.h}
          aria-label={labels.hue}
          aria-valuetext={`${Math.round(selection.h)}°`}
          onChange={(event) =>
            select({ ...selection, h: Number(event.currentTarget.value) })
          }
        />
        <input
          {...rangeProps}
          className={`${styles.slider} ${styles.alpha}`}
          type="range"
          aria-orientation="vertical"
          min={0}
          max={1}
          step={0.001}
          value={color.a}
          aria-label={labels.alpha}
          aria-valuetext={percent(color.a)}
          style={
            {
              "--color-picker-opaque": rgbCss({ ...color, a: 1 }),
              "--color-picker-transparent": rgbCss({ ...color, a: 0 }),
            } as CSSProperties
          }
          onChange={(event) =>
            publish({ ...color, a: Number(event.currentTarget.value) })
          }
        />
      </div>
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
  );
}
