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
import { useUI } from "../../providers/ui-provider";
import {
  addDays,
  addMonths,
  boundDate,
  localToday,
  monthDays,
  monthOf,
  readDate,
  validDate,
} from "./date-picker-model";
import styles from "./date-picker.module.css";
import motion from "../dialog-surface/dialog-surface.module.css";

export type DatePickerProps = Omit<
  ButtonProps,
  "children" | "value" | "defaultValue" | "onChange" | "name" | "type"
> & {
  label: string;
  /** A Gregorian date in YYYY-MM-DD form, or null for no selection. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  name?: string;
  min?: string;
  max?: string;
  isDateDisabled?: (value: string) => boolean;
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  placeholder?: string;
  clearable?: boolean;
  readOnly?: boolean;
};

/** A date-only field with an anchored, keyboard-navigable Gregorian calendar. */
export function DatePicker({
  label,
  value,
  defaultValue = null,
  onChange,
  name,
  min,
  max,
  isDateDisabled,
  locale = "en-US",
  weekStartsOn = 0,
  placeholder,
  clearable = true,
  readOnly = false,
  disabled = false,
  ref,
  form,
  className = "",
  onClick,
  onKeyDown,
  ...props
}: DatePickerProps) {
  const { t } = useUI();
  const unavailable =
    disabled ||
    readOnly ||
    props.loading ||
    props["aria-disabled"] === true ||
    props["aria-disabled"] === "true";
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() => validDate(defaultValue));
  const selected = validDate(controlled ? value : internal);
  const lower = validDate(min),
    upper = validDate(max);
  const today = localToday();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(today);
  const [month, setMonth] = useState(monthOf(today));
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const focusDay = useRef(false);
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
      full: new Intl.DateTimeFormat(locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
        calendar: "gregory",
      }),
      month: new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        timeZone: "UTC",
        calendar: "gregory",
      }),
      weekday: new Intl.DateTimeFormat(locale, {
        weekday: "short",
        timeZone: "UTC",
        calendar: "gregory",
      }),
      weekdayFull: new Intl.DateTimeFormat(locale, {
        weekday: "long",
        timeZone: "UTC",
        calendar: "gregory",
      }),
      day: new Intl.NumberFormat(locale),
    }),
    [locale],
  );
  const display = selected
    ? formatters.date.format(readDate(selected))
    : (placeholder ?? t("Choose date"));
  const available = (date: string) =>
    (!lower || date >= lower) &&
    (!upper || date <= upper) &&
    !isDateDisabled?.(date);
  const days = monthDays(month, weekStartsOn);
  const monthLabel = formatters.month.format(readDate(month));
  const previous = addMonths(month, -1),
    next = addMonths(month, 1);
  const canPrevious =
    !!previous && (!lower || previous.slice(0, 7) >= lower.slice(0, 7));
  const canNext = !!next && (!upper || next.slice(0, 7) <= upper.slice(0, 7));

  function close(restore = false) {
    setOpen(false);
    if (restore) trigger.current?.focus({ preventScroll: true });
  }
  function show() {
    if (unavailable || trigger.current?.matches(":disabled")) return;
    const date = boundDate(selected ?? today, lower, upper);
    setFocused(date);
    setMonth(monthOf(date));
    focusDay.current = true;
    setOpen(true);
  }
  function choose(date: string | null) {
    if (
      unavailable ||
      trigger.current?.matches(":disabled") ||
      (date && !available(date))
    )
      return;
    if (!controlled) setInternal(date);
    if (date !== selected) onChange?.(date);
    close(true);
  }
  function move(date: string | null) {
    if (!date) return;
    const target = boundDate(date, lower, upper);
    if (target === focused && monthOf(target) === month) return;
    setFocused(target);
    setMonth(monthOf(target));
    focusDay.current = true;
  }
  function navigate(amount: number) {
    move(addMonths(month, amount));
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
  function gridKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (!(event.target as HTMLElement).closest("[data-date]")) return;
    const weekday = (readDate(focused)!.getUTCDay() - weekStartsOn + 7) % 7;
    const target = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -weekday),
      End: () => addDays(focused, 6 - weekday),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
    }[event.key];
    if (target) {
      event.preventDefault();
      event.stopPropagation();
      move(target());
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
        if (!controlled) setInternal(validDate(defaultValue));
        setOpen(false);
      });
    owner?.addEventListener("reset", reset);
    return () => owner?.removeEventListener("reset", reset);
  }, [controlled, defaultValue, form]);
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
  useLayoutEffect(() => {
    if (!open || !focusDay.current) return;
    const day = popup.current?.querySelector<HTMLElement>(
      `[data-date="${focused}"]`,
    );
    if (day) {
      day.focus({ preventScroll: true });
      day.scrollIntoView({ block: "nearest", inline: "nearest" });
      focusDay.current = false;
    }
  }, [open, focused, month]);
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
        data-empty={!selected || undefined}
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
      <input
        ref={input}
        type="hidden"
        name={name}
        form={form}
        value={selected ?? ""}
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
            <div className={styles.content}>
              <header className={styles.header}>
                <Button
                  type="button"
                  className={styles.navigation}
                  disabled={!canPrevious}
                  aria-label={t("Previous month")}
                  onClick={() => navigate(-1)}
                >
                  <Chevron />
                </Button>
                <span
                  className={styles.month}
                  id={`${id}-month`}
                  aria-live="polite"
                >
                  {monthLabel}
                </span>
                <Button
                  type="button"
                  className={styles.navigation}
                  disabled={!canNext}
                  aria-label={t("Next month")}
                  onClick={() => navigate(1)}
                >
                  <Chevron next />
                </Button>
              </header>
              <div
                role="grid"
                aria-labelledby={`${id}-month`}
                className={styles.grid}
                onKeyDown={gridKeys}
                dir="ltr"
              >
                <div role="row" className={styles.week}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const day = readDate(
                      addDays("2024-01-07", (i + weekStartsOn) % 7)!,
                    )!;
                    return (
                      <span
                        key={i}
                        role="columnheader"
                        className={styles.weekday}
                        aria-label={formatters.weekdayFull.format(day)}
                      >
                        {formatters.weekday.format(day)}
                      </span>
                    );
                  })}
                </div>
                {Array.from({ length: 6 }, (_, row) => (
                  <div role="row" className={styles.week} key={row}>
                    {days.slice(row * 7, row * 7 + 7).map((date, index) => (
                      <div
                        role="gridcell"
                        aria-selected={!!date && date === selected}
                        key={date ?? index}
                      >
                        {date && (
                          <Button
                            type="button"
                            className={styles.day}
                            tabIndex={date === focused ? 0 : -1}
                            data-date={date}
                            data-outside={monthOf(date) !== month || undefined}
                            data-selected={date === selected || undefined}
                            aria-disabled={!available(date) || undefined}
                            aria-current={date === today ? "date" : undefined}
                            aria-label={formatters.full.format(readDate(date))}
                            onFocus={() => setFocused(date)}
                            onClick={() => choose(date)}
                          >
                            {formatters.day.format(
                              readDate(date)!.getUTCDate(),
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <footer className={styles.footer}>
                <Button
                  type="button"
                  disabled={!available(today)}
                  onClick={() => choose(today)}
                >
                  {t("Today")}
                </Button>
                {clearable && (
                  <Button
                    type="button"
                    disabled={!selected}
                    onClick={() => choose(null)}
                  >
                    {t("Clear date")}
                  </Button>
                )}
              </footer>
            </div>
          </ScrollArea>
        </MenuSurface>
      )}
    </>
  );
}

function Chevron({ next = false }: { next?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={next ? "m6 4 4 4-4 4" : "m10 4-4 4 4 4"} />
    </svg>
  );
}
