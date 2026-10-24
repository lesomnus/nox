import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
} from "react";
import {
  normalizeRgb,
  parseRgb,
  rgbByte,
  rgbChannels,
  rgbCss,
  sameRgb,
  type RgbChannel,
  type RgbColor,
} from "./rgb-color-model";
import styles from "./rgb-color-input.module.css";

export type { RgbColor, RgbChannel } from "./rgb-color-model";

export type RgbColorInputProps = Omit<
  ComponentPropsWithRef<"fieldset">,
  "children" | "onChange" | "defaultValue"
> & {
  /** Accessible group name. Use aria-labelledby to refer to a visible heading. */
  label: string;
  value?: RgbColor;
  defaultValue?: RgbColor;
  onChange?: (value: RgbColor) => void;
  readOnly?: boolean;
  channelLabels?: Partial<Record<RgbChannel, string>>;
};

const black: RgbColor = { r: 0, g: 0, b: 0 };
const defaultLabels = { r: "Red", g: "Green", b: "Blue" };

/** Three native byte inputs with a live sRGB preview. */
export function RgbColorInput({
  label,
  value,
  defaultValue = black,
  onChange,
  readOnly = false,
  channelLabels,
  disabled,
  name,
  form,
  className = "",
  onPaste,
  ...props
}: RgbColorInputProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() => normalizeRgb(defaultValue));
  const color = normalizeRgb(value ?? internal);
  const [revision, setRevision] = useState(0);
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

  useEffect(() => {
    if (controlled) return;
    const owner = root.current?.form;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        setInternal(normalizeRgb(defaultValue));
        setRevision((previous) => previous + 1);
      });
    owner?.addEventListener("reset", reset);
    return () => owner?.removeEventListener("reset", reset);
  }, [controlled, defaultValue, form]);

  function change(next: RgbColor) {
    if (disabled || readOnly || sameRgb(color, next)) return;
    if (!controlled) setInternal(next);
    onChange?.(next);
  }

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
        if (event.defaultPrevented || disabled || readOnly) return;
        const pasted = parseRgb(event.clipboardData.getData("text/plain"));
        if (pasted) {
          event.preventDefault();
          change(pasted);
          setRevision((previous) => previous + 1);
        }
      }}
    >
      <span
        className={styles.preview}
        style={{ backgroundColor: rgbCss(color) }}
        aria-hidden="true"
        data-rgb-color="preview"
      />
      {rgbChannels.map((channel) => (
        <ChannelInput
          key={channel}
          channel={channel}
          label={channelLabels?.[channel] ?? defaultLabels[channel]}
          value={color[channel]}
          revision={revision}
          readOnly={readOnly}
          name={name ? `${name}.${channel}` : undefined}
          form={form}
          invalid={props["aria-invalid"]}
          description={props["aria-describedby"]}
          onChange={(next) => change({ ...color, [channel]: next })}
        />
      ))}
    </fieldset>
  );
}

function ChannelInput({
  channel,
  label,
  value,
  revision,
  readOnly,
  name,
  form,
  invalid,
  description,
  onChange,
}: {
  channel: RgbChannel;
  label: string;
  value: number;
  revision: number;
  readOnly: boolean;
  name?: string;
  form?: string;
  invalid?: RgbColorInputProps["aria-invalid"];
  description?: string;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const proposed = useRef(value);
  useLayoutEffect(() => {
    // Accept the caller's own normalized value without erasing a temporary
    // numeric draft; unrelated external updates immediately replace it.
    if (value !== proposed.current) setDraft(null);
    proposed.current = value;
  }, [value]);
  useLayoutEffect(() => {
    setDraft(null);
  }, [revision, readOnly]);
  return (
    <label className={styles.channel}>
      <span className={styles.prefix} aria-hidden="true">
        {channel.toUpperCase()}
      </span>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={description}
        min={0}
        max={255}
        step={1}
        name={name}
        form={form}
        readOnly={readOnly}
        value={draft ?? value}
        onChange={(event) => {
          const text = event.currentTarget.value;
          setDraft(text);
          const number = event.currentTarget.valueAsNumber;
          if (text !== "" && Number.isFinite(number)) {
            proposed.current = rgbByte(number);
            onChange(proposed.current);
          }
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === "Escape") setDraft(null);
        }}
      />
    </label>
  );
}
