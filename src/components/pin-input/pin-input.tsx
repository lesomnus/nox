import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import {
  normalizePin,
  pastePin,
  pinInputGroups,
  type PinInputMode,
} from "./pin-input-model";
import styles from "./pin-input.module.css";
import { useShake, type ShakeOptions } from "../../effects/shake/use-shake";

export type { PinInputMode } from "./pin-input-model";

export type PinInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | "size"
  | "type"
  | "children"
  | "value"
  | "defaultValue"
  | "onChange"
  | "maxLength"
  | "minLength"
  | "pattern"
> & {
  label: string;
  /** Number of slots, default 6. groups takes precedence when supplied. */
  length?: number;
  /** Slot counts per group, e.g. [4, 4] for a device code. */
  groups?: readonly number[];
  separator?: ReactNode;
  mode?: PinInputMode;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  masked?: boolean;
  /** Animate independent slots on failure; false disables, an object customizes motion. */
  errorShake?: boolean | ShakeOptions;
  /** Native input ref for focus, labels, form validity and selection. */
  ref?: Ref<HTMLInputElement>;
};

/** A single native code input presented as grouped character slots. */
export function PinInput({
  label,
  length = 6,
  groups,
  separator = "–",
  mode = "numeric",
  value,
  defaultValue = "",
  onChange,
  onComplete,
  masked = false,
  errorShake = true,
  className = "",
  style,
  ref,
  disabled,
  readOnly,
  autoComplete = "one-time-code",
  inputMode = mode === "numeric" ? "numeric" : "text",
  onKeyDown,
  onPointerDown,
  onPaste,
  onFocus,
  onSelect,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: PinInputProps) {
  const sizes = pinInputGroups(length, groups);
  const count = sizes.reduce((sum, size) => sum + size, 0);
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() =>
    normalizePin(defaultValue, mode, count),
  );
  const code = normalizePin(value ?? internal, mode, count);
  const [composition, setComposition] = useState<string | null>(null);
  const composing = useRef(false);
  const input = useRef<HTMLInputElement | null>(null);
  const slots = useRef<(HTMLSpanElement | null)[]>([]);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const pendingSelection = useRef<readonly [number, number] | null>(null);
  const currentValue = useRef(code);
  const invalid = Boolean(
    props["aria-invalid"] && props["aria-invalid"] !== "false",
  );
  const busy = Boolean(props["aria-busy"] && props["aria-busy"] !== "false");
  const shakeEnabled = errorShake !== false;
  const { shake, cancel } = useShake();
  useEffect(() => {
    if (invalid && !busy && shakeEnabled)
      shake(
        slots.current,
        typeof errorShake === "object" ? errorShake : undefined,
      );
    else cancel();
    // Option changes apply to the next failure, not every focus/selection render.
  }, [invalid, busy, shakeEnabled, shake, cancel]);
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    },
    [ref],
  );

  useLayoutEffect(() => {
    currentValue.current = code;
    if (pendingSelection.current && input.current) {
      input.current.setSelectionRange(...pendingSelection.current);
      pendingSelection.current = null;
    }
  }, [code, selection]);

  useEffect(() => {
    if (controlled) return;
    const form = input.current?.form;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        setInternal(normalizePin(defaultValue, mode, count));
        setComposition(null);
        composing.current = false;
        setSelection({ start: 0, end: 0 });
      });
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [controlled, defaultValue, mode, count, props.form]);

  const selectSlot = (index: number) => {
    const start = Math.max(0, Math.min(index, code.length, count - 1));
    const end = start < code.length ? start + 1 : start;
    input.current?.focus();
    input.current?.setSelectionRange(start, end);
    pendingSelection.current = [start, end];
    setSelection({ start, end });
  };
  const commit = (next: string, cursor: number) => {
    const start = Math.min(cursor, next.length);
    const end = start < next.length ? start + 1 : start;
    pendingSelection.current = [start, end];
    setSelection({ start, end });
    const changed = next !== currentValue.current;
    currentValue.current = next;
    if (!controlled) setInternal(next);
    if (changed) {
      onChange?.(next);
      if (next.length === count) onComplete?.(next);
    }
  };
  const acceptInput = (element: HTMLInputElement) => {
    const raw = element.value;
    const cursor = normalizePin(
      raw.slice(0, element.selectionStart ?? raw.length),
      mode,
      count,
    ).length;
    commit(normalizePin(raw, mode, count), cursor);
  };
  const displayCode =
    composition === null ? code : normalizePin(composition, mode, count);
  const active = Math.min(selection.start, code.length, count - 1);
  let offset = 0;
  return (
    <div
      className={`${styles.root} ${className}`}
      style={style}
      dir="ltr"
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-invalid={invalid || undefined}
    >
      <input
        {...props}
        ref={attach}
        className={styles.input}
        type={masked ? "password" : "text"}
        aria-label={props["aria-label"] ?? label}
        value={composition ?? code}
        disabled={disabled}
        readOnly={readOnly}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoCapitalize={mode === "alphanumeric" ? "characters" : "off"}
        autoCorrect="off"
        spellCheck={false}
        pattern={mode === "numeric" ? `[0-9]{${count}}` : `[A-Z0-9]{${count}}`}
        onChange={(event) => {
          if (composing.current) setComposition(event.currentTarget.value);
          else acceptInput(event.currentTarget);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          selectSlot(Math.min(code.length, count - 1));
        }}
        onSelect={(event) => {
          onSelect?.(event);
          const start = event.currentTarget.selectionStart ?? 0;
          const end = event.currentTarget.selectionEnd ?? start;
          setSelection((previous) =>
            previous.start === start && previous.end === end
              ? previous
              : { start, end },
          );
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (event.defaultPrevented || disabled || event.button !== 0) return;
          event.preventDefault();
          let nearest = 0;
          let distance = Infinity;
          slots.current.slice(0, count).forEach((slot, index) => {
            if (!slot) return;
            const bounds = slot.getBoundingClientRect();
            const gap = Math.abs(
              event.clientX - (bounds.left + bounds.width / 2),
            );
            if (gap < distance) {
              distance = gap;
              nearest = index;
            }
          });
          selectSlot(nearest);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            event.defaultPrevented ||
            event.nativeEvent.isComposing ||
            composing.current ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
          )
            return;
          const index = event.currentTarget.selectionStart ?? 0;
          const target =
            event.key === "ArrowLeft"
              ? index - 1
              : event.key === "ArrowRight"
                ? index + 1
                : event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? code.length
                    : null;
          if (target !== null) {
            event.preventDefault();
            selectSlot(target);
          }
        }}
        onPaste={(event) => {
          onPaste?.(event);
          if (event.defaultPrevented || disabled || readOnly) return;
          event.preventDefault();
          const element = event.currentTarget;
          const result = pastePin(
            code,
            event.clipboardData.getData("text"),
            element.selectionStart ?? code.length,
            element.selectionEnd ?? code.length,
            mode,
            count,
          );
          if (result) commit(result.value, result.cursor);
        }}
        onCompositionStart={(event) => {
          composing.current = true;
          setComposition(event.currentTarget.value);
          onCompositionStart?.(event);
        }}
        onCompositionEnd={(event) => {
          composing.current = false;
          setComposition(null);
          acceptInput(event.currentTarget);
          onCompositionEnd?.(event);
        }}
      />
      <div className={styles.slots} aria-hidden="true">
        {sizes.map((size, group) => {
          const start = offset;
          offset += size;
          return (
            <Fragment key={group}>
              {group > 0 && (
                <span className={styles.separator}>{separator}</span>
              )}
              <span className={styles.group}>
                {Array.from({ length: size }, (_, local) => {
                  const index = start + local;
                  const character = displayCode[index];
                  return (
                    <span
                      key={index}
                      ref={(node) => {
                        slots.current[index] = node;
                      }}
                      className={styles.slot}
                      data-pin-slot={index}
                      data-active={index === active || undefined}
                      data-selected={
                        (index >= selection.start && index < selection.end) ||
                        undefined
                      }
                      data-empty={!character || undefined}
                    >
                      {character ? (masked ? "•" : character) : ""}
                    </span>
                  );
                })}
              </span>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
