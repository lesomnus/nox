import {
  useEffect,
  useId,
  createContext,
  useContext,
  useCallback,
  type ComponentPropsWithRef,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Button, type ButtonProps } from "../button/button";
import { SlidingPages, SlidingPage } from "../sliding-pages/sliding-pages";
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
} from "../date-picker/date-picker-model";
import {
  containsDate,
  dateGroup,
  emptySelection,
  hasSelection,
  normalizeSelection,
  rangeAvailable,
  sameSelection,
  selectDates,
  selectionComplete,
  selectionStart,
  type DatePickerSelection,
  type DatePickerSelectionProps,
} from "../date-picker/date-picker-selection";
export {
  dateWeekSelection,
  dateWindowSelection,
} from "../date-picker/date-picker-selection";
export type {
  DatePickerMode,
  DatePickerRange,
  DatePickerSelection,
  DatePickerSelectionContext,
  DatePickerSelectionResolver,
} from "../date-picker/date-picker-selection";
import styles from "../date-picker/date-picker.module.css";

export type CalendarDateInfo = {
  disabled?: boolean;
  label?: string;
  description?: string;
  /** Decorative content; label/description provide its accessible meaning. */
  marker?: ReactNode;
  className?: string;
  style?: CSSProperties;
};
import { DateSelectionFields } from "../date-picker/date-selection-fields";
export type CalendarRootProps = Omit<
  ComponentPropsWithRef<"div">,
  "onChange" | "defaultValue" | "onSelect"
> & {
  label: string;
  min?: string;
  max?: string;
  isDateDisabled?: (value: string) => boolean;
  getDateInfo?: (date: string) => CalendarDateInfo | null | undefined;
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  clearable?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  form?: string;
  /** Initially visible month, expressed as a valid YYYY-MM-DD date. */
  defaultMonth?: string;
  /** Called for every accepted day selection, including reselecting the current day. */
  onSelect?: (selection: DatePickerSelection) => void;
  onClear?: () => void;
  /** When supplied, the default footer includes a Done button. */
  onDone?: () => void;
} & DatePickerSelectionProps;
export type CalendarProps = CalendarRootProps;
function useCalendarModel(options: CalendarRootProps) {
  const {
    value,
    defaultValue = null,
    mode = "single",
    getSelectionDates,
    min,
    max,
    isDateDisabled,
    getDateInfo,
    locale = "en-US",
    weekStartsOn = 0,
    clearable = true,
    disabled = false,
    readOnly = false,
    form,
    autoFocus = false,
    defaultMonth,
    onChange,
    onSelect,
    onClear,
    onDone,
  } = options;
  const { t } = useUI();
  const unavailable = disabled || readOnly;
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() =>
    normalizeSelection(mode, defaultValue),
  );
  const selected = normalizeSelection(
    mode,
    controlled ? value : internal.mode === mode ? internal.value : defaultValue,
  );
  const lower = validDate(min),
    upper = validDate(max);
  const today = localToday();
  const initialDate = boundDate(
    validDate(defaultMonth) ?? selectionStart(selected) ?? today,
    lower,
    upper,
  );
  const [focused, setFocused] = useState(initialDate);
  const [month, setMonth] = useState(() => monthOf(initialDate));
  const [hovered, setHovered] = useState<string | null>(null);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const focusDay = useRef(autoFocus);
  const [focusRequest, requestFocus] = useState(0);
  const id = useId();
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
  const filled = hasSelection(selected);
  const days = useMemo(
    () => monthDays(month, weekStartsOn),
    [month, weekStartsOn],
  );
  const dateInfo = useMemo(
    () =>
      new Map(
        days.flatMap((date) =>
          date ? [[date, getDateInfo?.(date) ?? {}] as const] : [],
        ),
      ),
    [days, getDateInfo],
  );
  const info = (date: string): CalendarDateInfo =>
    dateInfo.get(date) ?? getDateInfo?.(date) ?? {};
  const available = (date: string) =>
    !unavailable &&
    (!lower || date >= lower) &&
    (!upper || date <= upper) &&
    !isDateDisabled?.(date) &&
    !info(date).disabled;
  const candidates = new Map<string, DatePickerSelection | null>();
  function candidate(date: string, validateRange = false) {
    if (!candidates.has(date)) {
      const dates = getSelectionDates
        ? dateGroup(getSelectionDates(date, { ...selected, weekStartsOn }))
        : undefined;
      const next =
        available(date) &&
        (!getSelectionDates || !!dates) &&
        (!dates || dates.every(available))
          ? selectDates(selected, date, dates ?? undefined)
          : null;
      candidates.set(date, next);
    }
    const next = candidates.get(date)!;
    if (
      validateRange &&
      next?.mode === "range" &&
      next.value?.end &&
      !rangeAvailable(
        next.value,
        getDateInfo || isDateDisabled ? available : undefined,
      )
    )
      return null;
    return next;
  }
  const inspected = hovered ?? focused;
  const inspectedInfo = info(inspected);
  const proposed = hovered ? candidate(hovered) : null;
  const actualRange =
    selected.mode === "range" && selected.value?.end ? selected.value : null;
  const previewRange =
    mode === "range" &&
    proposed?.mode === "range" &&
    proposed.value?.end &&
    (getSelectionDates ||
      (selected.mode === "range" && selected.value && !selected.value.end))
      ? proposed.value
      : null;
  const previewDates =
    proposed && mode === "multiple" && getSelectionDates
      ? dateGroup(getSelectionDates(inspected, { ...selected, weekStartsOn }))
      : null;
  const status =
    error ||
    (mode === "multiple" && selected.mode === "multiple"
      ? t("{count} selected", {
          count: formatters.day.format(selected.value.length),
        })
      : mode === "range"
        ? t(
            selected.mode === "range" && selected.value && !selected.value.end
              ? "Choose an end date"
              : "Choose a start date",
          )
        : "");
  const monthLabel = formatters.month.format(readDate(month));
  const previous = addMonths(month, -1),
    next = addMonths(month, 1);
  const canPrevious =
    !!previous && (!lower || previous.slice(0, 7) >= lower.slice(0, 7));
  const canNext = !!next && (!upper || next.slice(0, 7) <= upper.slice(0, 7));

  function commit(next: DatePickerSelection) {
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
    setError("");
  }
  function choose(date: string) {
    if (
      unavailable ||
      root.current?.closest("fieldset[disabled]") ||
      !available(date)
    )
      return;
    const next = candidate(date, true);
    if (!next) {
      setError(t("This selection is unavailable."));
      return;
    }
    commit(next);
    setFocused(date);
    setMonth(monthOf(date));
    setHovered(null);
    focusDay.current = true;
    requestFocus((request) => request + 1);
    onSelect?.(next);
  }
  function clear() {
    if (unavailable || root.current?.closest("fieldset[disabled]")) return;
    commit(emptySelection(mode));
    setHovered(null);
    focusDay.current = true;
    requestFocus((request) => request + 1);
    onClear?.();
  }
  function move(date: string | null) {
    if (!date) return;
    const target = boundDate(date, lower, upper);
    if (target === focused && monthOf(target) === month) return;
    setFocused(target);
    setMonth(monthOf(target));
    focusDay.current = true;
    requestFocus((request) => request + 1);
  }
  function navigate(amount: number) {
    move(addMonths(month, amount));
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
      setHovered(null);
      setError("");
      move(target());
    }
  }

  useEffect(() => {
    if (controlled) return;
    const owner = input.current?.form;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        const next = normalizeSelection(mode, defaultValue);
        setInternal(next);
        const start = boundDate(selectionStart(next) ?? today, lower, upper);
        setFocused(start);
        setMonth(monthOf(start));
        setHovered(null);
        setError("");
      });
    owner?.addEventListener("reset", reset);
    return () => owner?.removeEventListener("reset", reset);
  }, [controlled, defaultValue, form, mode, lower, upper]);
  const selectionKey = JSON.stringify(selected);
  const lastSelection = useRef(selectionKey);
  useLayoutEffect(() => {
    const start = selectionStart(selected);
    if (
      lastSelection.current !== selectionKey &&
      start &&
      !root.current?.contains(document.activeElement)
    ) {
      const target = boundDate(start, lower, upper);
      setFocused(target);
      setMonth(monthOf(target));
      setHovered(null);
      setError("");
    }
    lastSelection.current = selectionKey;
  }, [selectionKey, lower, upper]);
  useLayoutEffect(() => {
    if (!focusDay.current || disabled) return;
    const day = [
      ...(root.current?.querySelectorAll<HTMLElement>(
        `[data-date="${focused}"]`,
      ) ?? []),
    ].find((element) => !element.closest("[inert]"));
    if (day) {
      day.focus({ preventScroll: true });
      day.scrollIntoView({ block: "nearest", inline: "nearest" });
      focusDay.current = false;
    }
  }, [focused, month, internal, value, disabled, focusRequest]);

  return {
    root,
    input,
    id,
    t,
    monthLabel,
    canPrevious,
    canNext,
    navigate,
    mode,
    gridKeys,
    setHovered,
    days,
    weekStartsOn,
    formatters,
    info,
    selected,
    previewRange,
    actualRange,
    proposed,
    previewDates,
    month,
    focused,
    candidate,
    today,
    setError,
    setFocused,
    choose,
    getDateInfo,
    inspectedInfo,
    inspected,
    status,
    filled,
    clear,
    clearable,
    onDone,
    disabled,
    unavailable,
  };
}
const Context = createContext<ReturnType<typeof useCalendarModel> | null>(null);
function useCalendar() {
  const state = useContext(Context);
  if (!state) throw new Error("Calendar parts must be inside CalendarRoot.");
  return state;
}
export function CalendarRoot(options: CalendarRootProps) {
  const state = useCalendarModel(options);
  const {
    label,
    value,
    defaultValue,
    mode,
    getSelectionDates,
    min,
    max,
    isDateDisabled,
    getDateInfo,
    locale,
    weekStartsOn,
    clearable,
    disabled,
    readOnly,
    name,
    form,
    autoFocus,
    defaultMonth,
    onChange,
    onSelect,
    onClear,
    onDone,
    ref,
    className = "",
    ...props
  } = options;
  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      state.root.current = node;
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    },
    [ref, state.root],
  );
  return (
    <Context value={state}>
      <div
        role="group"
        aria-label={label}
        aria-disabled={disabled || undefined}
        {...props}
        ref={attach}
        className={`${styles.calendarRoot} ${className}`}
      >
        {props.children}
        <DateSelectionFields
          ref={state.input}
          selected={state.selected}
          name={name}
          form={form}
          disabled={disabled}
        />
      </div>
    </Context>
  );
}
export type CalendarHeaderProps = ComponentPropsWithRef<"header">;
export type CalendarMonthProps = ComponentPropsWithRef<"span">;
export type CalendarNavigationProps = ButtonProps;
export function CalendarPreviousMonth({
  className = "",
  onClick,
  disabled,
  children,
  ...props
}: CalendarNavigationProps) {
  const state = useCalendar();
  return (
    <Button
      type="button"
      aria-label={state.t("Previous month")}
      {...props}
      disabled={state.disabled || disabled || !state.canPrevious}
      className={`${styles.navigation} ${className}`}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) state.navigate(-1);
      }}
    >
      {children ?? <Chevron />}
    </Button>
  );
}
export function CalendarNextMonth({
  className = "",
  onClick,
  disabled,
  children,
  ...props
}: CalendarNavigationProps) {
  const state = useCalendar();
  return (
    <Button
      type="button"
      aria-label={state.t("Next month")}
      {...props}
      disabled={state.disabled || disabled || !state.canNext}
      className={`${styles.navigation} ${className}`}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) state.navigate(1);
      }}
    >
      {children ?? <Chevron next />}
    </Button>
  );
}
export function CalendarMonth({
  className = "",
  children,
  ...props
}: CalendarMonthProps) {
  const { monthLabel, id } = useCalendar();
  return (
    <span
      id={`${id}-month`}
      aria-live="polite"
      {...props}
      className={`${styles.month} ${className}`}
    >
      {children ?? monthLabel}
    </span>
  );
}
export function CalendarHeader({
  className = "",
  children,
  ...props
}: CalendarHeaderProps) {
  useCalendar();
  return (
    <header {...props} className={`${styles.header} ${className}`}>
      {children ?? (
        <>
          <CalendarPreviousMonth />
          <CalendarMonth />
          <CalendarNextMonth />
        </>
      )}
    </header>
  );
}
export type CalendarGridProps = Omit<ComponentPropsWithRef<"div">, "children">;
export function CalendarGrid({ className = "", ...props }: CalendarGridProps) {
  const {
    monthLabel,
    mode,
    gridKeys,
    setHovered,
    weekStartsOn,
    formatters,
    month,
  } = useCalendar();
  const [window, setWindow] = useState({
    current: month,
    previous: null as string | null,
  });
  if (window.current !== month)
    setWindow({ current: month, previous: window.current });
  const months = [
    ...new Set(
      [window.previous, window.current].filter(
        (value): value is string => !!value,
      ),
    ),
  ].sort();
  return (
    <div
      {...props}
      role="grid"
      aria-multiselectable={mode !== "single" || undefined}
      aria-label={props["aria-label"] ?? monthLabel}
      className={`${styles.grid} ${className}`}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (!event.defaultPrevented) gridKeys(event);
      }}
      dir="ltr"
      onPointerLeave={(event) => {
        props.onPointerLeave?.(event);
        if (!event.defaultPrevented) setHovered(null);
      }}
      onBlur={(event) => {
        props.onBlur?.(event);
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setHovered(null);
      }}
    >
      <div role="row" className={styles.week}>
        {Array.from({ length: 7 }, (_, i) => {
          const day = readDate(addDays("2024-01-07", (i + weekStartsOn) % 7)!)!;
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
      <SlidingPages value={month} focusOnChange={false} role="presentation">
        {months.map((value) => (
          <SlidingPage
            key={value}
            value={value}
            role="rowgroup"
            className={styles.monthPage}
          >
            <CalendarMonthRows month={value} active={value === month} />
          </SlidingPage>
        ))}
      </SlidingPages>
    </div>
  );
}

function CalendarMonthRows({
  month,
  active,
}: {
  month: string;
  active: boolean;
}) {
  const {
    info,
    selected,
    previewRange,
    actualRange,
    proposed,
    previewDates,
    focused,
    weekStartsOn,
    formatters,
    setHovered,
    candidate,
    today,
    setError,
    setFocused,
    choose,
    disabled,
  } = useCalendar();
  const days = useMemo(
    () => monthDays(month, weekStartsOn),
    [month, weekStartsOn],
  );
  return (
    <>
      {Array.from({ length: 6 }, (_, row) => (
        <div role="row" className={styles.week} key={row}>
          {days.slice(row * 7, row * 7 + 7).map((date, index) => {
            const details = date ? info(date) : {};
            const title = [details.label, details.description]
              .filter(Boolean)
              .join(" · ");
            const isSelected = !!date && containsDate(selected, date);
            const inPreview =
              !!date &&
              !!previewRange?.end &&
              date >= previewRange.start &&
              date <= previewRange.end;
            const inRange =
              !!date &&
              !!actualRange?.end &&
              date >= actualRange.start &&
              date <= actualRange.end;
            const band = inPreview
              ? previewRange
              : inRange
                ? actualRange
                : null;
            const endpoint =
              selected.mode !== "range"
                ? isSelected
                : !!date &&
                  !!selected.value &&
                  (date === selected.value.start ||
                    date === selected.value.end);
            const inGroup =
              !!date && !!proposed && !!previewDates?.includes(date);
            const previewEndpoint =
              !!date &&
              !!previewRange &&
              (date === previewRange.start || date === previewRange.end);
            const marker =
              details.marker === undefined
                ? details.label
                  ? "•"
                  : null
                : details.marker;
            return (
              <div
                role="gridcell"
                className={styles.cell}
                aria-selected={isSelected}
                data-band={
                  band ? (inPreview ? "preview" : "selected") : undefined
                }
                data-band-start={(!!date && band?.start === date) || undefined}
                data-band-end={(!!date && band?.end === date) || undefined}
                key={date ?? index}
              >
                {date && (
                  <Button
                    type="button"
                    className={`${styles.day} ${details.className ?? ""}`}
                    style={details.style}
                    disabled={disabled}
                    tabIndex={active && !disabled && date === focused ? 0 : -1}
                    data-date={date}
                    data-outside={monthOf(date) !== month || undefined}
                    data-selected={endpoint || undefined}
                    data-preview={inGroup || previewEndpoint || undefined}
                    aria-disabled={!candidate(date) || undefined}
                    aria-current={date === today ? "date" : undefined}
                    aria-label={[formatters.full.format(readDate(date)), title]
                      .filter(Boolean)
                      .join(" · ")}
                    title={title || undefined}
                    onPointerEnter={(event) => {
                      if (event.pointerType !== "touch") {
                        setHovered(date);
                        setError("");
                      }
                    }}
                    onFocus={() => {
                      setFocused(date);
                      setHovered(date);
                    }}
                    onClick={() => choose(date)}
                  >
                    <span className={styles.dayContent}>
                      <span>
                        {formatters.day.format(readDate(date)!.getUTCDate())}
                      </span>
                      {marker != null && (
                        <span className={styles.marker} aria-hidden="true">
                          {marker}
                        </span>
                      )}
                    </span>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}
export type CalendarDetailsProps = Omit<
  ComponentPropsWithRef<"div">,
  "children"
>;
export function CalendarDetails({
  className = "",
  ...props
}: CalendarDetailsProps) {
  const { getDateInfo, inspectedInfo, formatters, inspected } = useCalendar();
  return (
    <>
      {getDateInfo && (
        <div
          className={`${styles.dateInfo} ${className}`}
          {...props}
          aria-live="polite"
          aria-atomic="true"
        >
          <span>
            {inspectedInfo.label ?? formatters.full.format(readDate(inspected))}
          </span>
          <small title={inspectedInfo.description}>
            {inspectedInfo.description || "\u00a0"}
          </small>
        </div>
      )}
    </>
  );
}
export type CalendarStatusProps = Omit<
  ComponentPropsWithRef<"div">,
  "children"
>;
export function CalendarStatus({
  className = "",
  ...props
}: CalendarStatusProps) {
  const { mode, status } = useCalendar();
  return (
    <>
      {mode !== "single" && (
        <div
          className={`${styles.status} ${className}`}
          {...props}
          role="status"
          title={status}
        >
          {status}
        </div>
      )}
    </>
  );
}
export type CalendarActionProps = ButtonProps;
export type CalendarFooterProps = ComponentPropsWithRef<"footer">;
export function CalendarToday({
  disabled,
  onClick,
  children,
  ...props
}: CalendarActionProps) {
  const state = useCalendar();
  return (
    <Button
      type="button"
      {...props}
      disabled={disabled || !state.candidate(state.today)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) state.choose(state.today);
      }}
    >
      {children ?? state.t("Today")}
    </Button>
  );
}
export function CalendarClear({
  disabled,
  onClick,
  children,
  ...props
}: CalendarActionProps) {
  const state = useCalendar();
  return (
    <Button
      type="button"
      {...props}
      disabled={disabled || state.unavailable || !state.filled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) state.clear();
      }}
    >
      {children ?? state.t("Clear date")}
    </Button>
  );
}
export function CalendarDone({
  disabled,
  onClick,
  children,
  ...props
}: CalendarActionProps) {
  const state = useCalendar();
  return (
    <Button
      type="button"
      {...props}
      disabled={
        disabled || state.disabled || !selectionComplete(state.selected)
      }
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) state.onDone?.();
      }}
    >
      {children ?? state.t("Done")}
    </Button>
  );
}
export function CalendarFooter({
  className = "",
  children,
  ...props
}: CalendarFooterProps) {
  const { clearable, onDone } = useCalendar();
  return (
    <footer {...props} className={`${styles.footer} ${className}`}>
      {children ?? (
        <>
          <CalendarToday />
          {clearable && <CalendarClear />}
          {onDone && <CalendarDone />}
        </>
      )}
    </footer>
  );
}
export function Calendar({
  className = "",
  children,
  ...props
}: CalendarProps) {
  return (
    <CalendarRoot
      {...props}
      className={`${styles.calendar} ${styles.content} ${className}`}
    >
      {children ?? (
        <>
          <CalendarHeader />
          <CalendarGrid />
          <CalendarDetails />
          <CalendarStatus />
          <CalendarFooter />
        </>
      )}
    </CalendarRoot>
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
