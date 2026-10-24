import {
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Button, type ButtonProps } from "../button/button";
import { MenuSurface } from "../menu-surface/menu-surface";
import { ScrollArea } from "../scroll-area/scroll-area";
import { Calendar, type CalendarDateInfo } from "../calendar/calendar";
import { DateSelectionFields } from "./date-selection-fields";
import { useUI } from "../../providers/ui-provider";
import { readDate } from "./date-picker-model";
import {
  hasSelection,
  normalizeSelection,
  sameSelection,
  selectionComplete,
  type DatePickerSelection,
  type DatePickerSelectionProps,
} from "./date-picker-selection";
export {
  dateWeekSelection,
  dateWindowSelection,
} from "./date-picker-selection";
export type {
  DatePickerMode,
  DatePickerRange,
  DatePickerSelection,
  DatePickerSelectionContext,
  DatePickerSelectionResolver,
} from "./date-picker-selection";
import styles from "./date-picker.module.css";
import motion from "../dialog-surface/dialog-surface.module.css";
export type DatePickerDateInfo = CalendarDateInfo;
export type DatePickerProps = Omit<
  ButtonProps,
  "children" | "value" | "defaultValue" | "onChange" | "name" | "type"
> & {
  label: string;
  name?: string;
  min?: string;
  max?: string;
  isDateDisabled?: (value: string) => boolean;
  getDateInfo?: (date: string) => DatePickerDateInfo | null | undefined;
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  placeholder?: string;
  clearable?: boolean;
  readOnly?: boolean;
  /** Defaults to closing after a complete single/range selection; multiple stays open. */
  closeOnSelect?: boolean;
} & DatePickerSelectionProps;

/** A date-only field with an anchored, keyboard-navigable Gregorian calendar. */
export function DatePicker(options: DatePickerProps) {
  const {
    label,
    value,
    defaultValue = null,
    onChange,
    mode = "single",
    getSelectionDates,
    name,
    min,
    max,
    isDateDisabled,
    getDateInfo,
    locale = "en-US",
    weekStartsOn = 0,
    placeholder,
    clearable = true,
    readOnly = false,
    disabled = false,
    closeOnSelect,
    ref,
    form,
    className = "",
    onClick,
    onKeyDown,
    ...props
  } = options;
  const { t } = useUI();
  const unavailable =
    disabled ||
    readOnly ||
    props.loading ||
    props["aria-disabled"] === true ||
    props["aria-disabled"] === "true";
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() =>
    normalizeSelection(mode, defaultValue),
  );
  const selected = normalizeSelection(
    mode,
    controlled ? value : internal.mode === mode ? internal.value : defaultValue,
  );

  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  useImperativeHandle(ref, () => trigger.current!, []);
  const formatters = useMemo(
    () => ({
      date: new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
        calendar: "gregory",
      }),
      day: new Intl.NumberFormat(locale),
    }),
    [locale],
  );
  const formatDate = (date: string) => formatters.date.format(readDate(date));
  const filled = hasSelection(selected);
  const display = !filled
    ? (placeholder ?? t("Choose date"))
    : selected.mode === "single"
      ? formatDate(selected.value!)
      : selected.mode === "multiple"
        ? t("{count} selected", {
            count: formatters.day.format(selected.value.length),
          })
        : `${formatDate(selected.value!.start)} – ${selected.value!.end ? formatDate(selected.value!.end) : "…"}`;

  function close(restore = false) {
    setOpen(false);
    if (restore) trigger.current?.focus({ preventScroll: true });
  }
  function show() {
    if (!unavailable && !trigger.current?.matches(":disabled")) setOpen(true);
  }
  function commit(next: DatePickerSelection) {
    if (unavailable || trigger.current?.matches(":disabled")) return;
    if (!controlled) setInternal(next);
    if (!sameSelection(selected, next) && onChange) {
      if (options.mode === "multiple" && next.mode === "multiple")
        options.onChange?.([...next.value]);
      else if (options.mode === "range" && next.mode === "range")
        options.onChange?.(next.value ? { ...next.value } : null);
      else if (
        options.mode !== "multiple" &&
        options.mode !== "range" &&
        next.mode === "single"
      )
        options.onChange?.(next.value);
    }
  }
  function keys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === "Tab") {
      const buttons = [
        ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
          'button:not(:disabled):not([tabindex="-1"])',
        ),
      ];
      if (
        document.activeElement ===
        (event.shiftKey ? buttons[0] : buttons.at(-1))
      ) {
        event.stopPropagation();
        close(true);
      }
    }
  }
  useEffect(() => {
    if (unavailable) close();
  }, [unavailable]);
  useEffect(() => {
    const owner = input.current?.form;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        if (!controlled) setInternal(normalizeSelection(mode, defaultValue));
        setOpen(false);
      });
    owner?.addEventListener("reset", reset);
    return () => owner?.removeEventListener("reset", reset);
  }, [controlled, defaultValue, form, mode]);
  useLayoutEffect(() => {
    if (!open || !popup.current || !trigger.current) return;
    const element = popup.current,
      anchor = trigger.current;
    const position = () => {
      const rect = anchor.getBoundingClientRect();
      const css = getComputedStyle(element);
      const gap = parseFloat(css.getPropertyValue("--ui-space"));
      const inset = gap * 2;
      const chrome =
        parseFloat(css.paddingTop) +
        parseFloat(css.paddingBottom) +
        parseFloat(css.borderTopWidth) +
        parseFloat(css.borderBottomWidth);
      element.style.setProperty(
        "--date-picker-max-height",
        `${Math.max(0, innerHeight - inset * 2 - chrome)}px`,
      );
      const width = element.offsetWidth,
        height = element.offsetHeight;
      const above =
        innerHeight - rect.bottom - gap < height &&
        rect.top > innerHeight - rect.bottom;
      element.style.left = `${Math.max(inset, Math.min(rect.left, innerWidth - width - inset))}px`;
      element.style.top = `${Math.max(inset, Math.min(above ? rect.top - height - gap : rect.bottom + gap, innerHeight - height - inset))}px`;
      element.dataset.enterFrom = above ? "from-bottom" : "from-top";
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(element);
    observer.observe(anchor);
    const scroll = (event: Event) => {
      if (!element.contains(event.target as Node)) position();
    };
    window.addEventListener("resize", position);
    window.addEventListener("scroll", scroll, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (
        !popup.current?.contains(event.target as Node) &&
        !trigger.current?.contains(event.target as Node)
      )
        close();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const selectionProps: DatePickerSelectionProps =
    selected.mode === "multiple"
      ? {
          mode: "multiple",
          value: selected.value,
          getSelectionDates,
          onChange: (value) => commit({ mode: "multiple", value }),
        }
      : selected.mode === "range"
        ? {
            mode: "range",
            value: selected.value,
            getSelectionDates,
            onChange: (value) => commit({ mode: "range", value }),
          }
        : {
            mode: "single",
            value: selected.value,
            onChange: (value) => commit({ mode: "single", value }),
          };
  return (
    <>
      <Button
        {...props}
        ref={trigger}
        type="button"
        form={form}
        className={`${styles.trigger} ${className}`}
        disabled={disabled}
        aria-disabled={readOnly || props["aria-disabled"]}
        aria-label={props["aria-label"] ?? `${label}: ${display}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        data-empty={!filled || undefined}
        data-mode={mode}
        data-readonly={readOnly || undefined}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) open ? close() : show();
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            !event.defaultPrevented &&
            ["ArrowDown", "ArrowUp"].includes(event.key)
          ) {
            event.preventDefault();
            show();
          }
        }}
      >
        <span className={styles.value}>{display}</span>
        <svg
          className={styles.icon}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="14" height="13" rx="2" />
          <path d="M6.5 2.5v3M13.5 2.5v3M3 8h14" />
        </svg>
      </Button>
      <DateSelectionFields
        ref={input}
        selected={selected}
        name={name}
        form={form}
        disabled={disabled}
      />
      {open && (
        <MenuSurface
          ref={popup}
          anchor={trigger.current}
          id={id}
          className={`${styles.popup} ${motion.entrance}`}
          style={{ fontSize: "var(--ui-date-picker-font-size)" }}
          role="dialog"
          aria-label={t("Calendar for {label}", { label })}
          onKeyDown={keys}
          onBlur={(event) => {
            if (
              event.relatedTarget &&
              !event.currentTarget.contains(
                event.relatedTarget as Node | null,
              ) &&
              event.relatedTarget !== trigger.current
            )
              close();
          }}
        >
          <ScrollArea
            className={styles.scroll}
            viewportClassName={styles.viewport}
            scrollbarLabel={t("Scroll {label}", { label })}
          >
            <Calendar
              {...selectionProps}
              label={label}
              min={min}
              max={max}
              isDateDisabled={isDateDisabled}
              getDateInfo={getDateInfo}
              locale={locale}
              weekStartsOn={weekStartsOn}
              clearable={clearable}
              readOnly={!!unavailable || trigger.current?.matches(":disabled")}
              autoFocus
              style={{ width: "100%" }}
              onSelect={(next) => {
                if (
                  !unavailable &&
                  !trigger.current?.matches(":disabled") &&
                  (closeOnSelect ?? mode !== "multiple") &&
                  selectionComplete(next)
                )
                  close(true);
              }}
              onClear={() => {
                if (
                  !unavailable &&
                  !trigger.current?.matches(":disabled") &&
                  (mode === "single" || closeOnSelect === true)
                )
                  close(true);
              }}
              onDone={
                mode !== "single" || closeOnSelect === false
                  ? () => close(true)
                  : undefined
              }
            />
          </ScrollArea>
        </MenuSurface>
      )}
    </>
  );
}
