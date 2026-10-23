import { matchValueQuery, matchesValueQuery } from "./value-search";
import styles from "./value-menu.module.css";
import dialogStyles from "../dialog-surface/dialog-surface.module.css";
import {
  useEffect,
  useId,
  useLayoutEffect,
  Fragment,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "../button/button";
import { useUI } from "../../providers/ui-provider";

export type ValueOption = {
  value: string;
  label: string;
  /** Decorative content shown before the value label. */
  icon?: ReactNode;
  muted?: boolean;
  /** Keep the option visible while preventing selection. */
  disabled?: boolean;
  searchText?: string;
  /** Display a divider before this item when another visible item precedes it. */
  separatorBefore?: boolean;
};

export type ValueOptionGroup = {
  label?: string;
  /** Decorative content shown before the section title. */
  icon?: ReactNode;
  items: ValueOption[];
};

// The selected row overlays the trigger text exactly. A portal avoids clipping
// inside settings panes while sharing the composer menu's focus and geometry.
export function ValueMenu({
  label,
  display,
  value,
  options: items = [],
  groups,
  muted = false,
  minMenuWidth = 140,
  variant = "default",
  disabled,
  disabledReason,
  choose,
  searchable = false,
}: {
  label: string;
  display?: string;
  value: string;
  options?: ValueOption[];
  /** Titled/untitled sections; when supplied, these replace options. */
  groups?: ValueOptionGroup[];
  muted?: boolean;
  minMenuWidth?: number;
  variant?: "default" | "compact";
  disabled?: boolean;
  disabledReason?: string;
  choose: (value: string) => void;
  searchable?: boolean;
}) {
  const { t } = useUI();
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const [query, setQuery] = useState("");
  const [queryEdited, setQueryEdited] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(true);
  const sections = groups ?? [{ items }];
  const selected = sections
    .flatMap((section) => section.items)
    .find((item) => item.value === value);
  const text = display ?? selected?.label ?? value;
  const isMuted = muted || selected?.muted;
  const visibleSections = sections
    .map((section, index) => ({
      ...section,
      index,
      items: section.items.filter(
        (item) =>
          item.value !== value &&
          (!searchable ||
            !queryEdited ||
            matchesValueQuery(`${item.label} ${item.searchText ?? ""}`, query)),
      ),
    }))
    .filter((section) => section.items.length > 0);
  const options = visibleSections.flatMap((section) => section.items);
  const trigger = () =>
    root.current?.querySelector<HTMLButtonElement>(".setting-trigger");
  function openMenu() {
    setQuery(text);
    setQueryEdited(false);
    setOpen(true);
  }
  function close(restore = false) {
    setOpen(false);
    setQuery("");
    if (restore) trigger()?.focus({ preventScroll: true });
  }
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () =>
      el.style.setProperty("--value-width", `${el.clientWidth}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    if (!open || !root.current || !menu.current) return;
    const position = () => {
      if (!root.current || !menu.current) return;
      const rect = root.current.getBoundingClientRect();
      const inset = parseFloat(
        getComputedStyle(root.current).getPropertyValue("--ui-control-inset"),
      );
      const chrome = rect.height + 2 * inset + 13;
      const popup = menu.current;
      // The portal leaves the trigger's typography context, including numeric
      // variants that can also change the width of punctuation such as '-'.
      const typography = getComputedStyle(trigger() ?? root.current);
      for (const property of [
        "fontFamily",
        "fontSize",
        "fontWeight",
        "fontStyle",
        "fontVariant",
        "fontFeatureSettings",
        "fontVariationSettings",
        "letterSpacing",
      ] as const) {
        popup.style[property] = typography[property];
      }
      const valueText = trigger()?.querySelector(".meta-value");
      if (valueText) {
        popup.style.setProperty(
          "--value-text-width",
          getComputedStyle(valueText).width,
        );
      }
      popup.style.setProperty("--value-width", `${rect.width}px`);
      popup.style.setProperty(
        "--menu-width",
        `${Math.min(window.innerWidth - 2 * inset, Math.max(rect.width + 2 * inset, minMenuWidth))}px`,
      );
      // Headers and dividers also take space. Measure the complete list after
      // applying its width/typography, even when it is already scroll-clipped.
      const list = popup.querySelector<HTMLElement>(".setting-options");
      const height = chrome + (list?.scrollHeight ?? 0);
      const upwards = rect.top + height > window.innerHeight;
      setUp(upwards);
      popup.style.left = `${Math.min(rect.left - inset, window.innerWidth - parseFloat(popup.style.getPropertyValue("--menu-width")) - inset)}px`;
      popup.style.top = upwards ? "auto" : `${rect.top - inset}px`;
      popup.style.bottom = upwards
        ? `${window.innerHeight - rect.bottom - inset}px`
        : "auto";
      popup.style.setProperty(
        "--options-height",
        `${Math.max(rect.height, Math.min(240, (upwards ? rect.bottom : window.innerHeight - rect.top) - chrome))}px`,
      );
      const anchor = trigger()?.querySelector(".button-content");
      const current = popup.querySelector(
        ".setting-current .button-content, .setting-search",
      );
      if (anchor && current) {
        const before = anchor.getBoundingClientRect();
        const after = current.getBoundingClientRect();
        // Content centers stay fixed during the button's press scale. Align
        // the actual row instead of assuming the trigger fills its wrapper.
        const shift =
          before.top + before.height / 2 - after.top - after.height / 2;
        if (upwards)
          popup.style.bottom = `${parseFloat(popup.style.bottom) - shift}px`;
        else popup.style.top = `${parseFloat(popup.style.top) + shift}px`;
      }
    };
    position();
    const scrolled = (e: Event) => {
      if (!menu.current?.contains(e.target as Node)) position();
    };
    document.addEventListener("scroll", scrolled, true);
    return () => document.removeEventListener("scroll", scrolled, true);
  }, [open, items, groups, query, queryEdited, minMenuWidth, searchable, up]);
  useLayoutEffect(() => {
    if (!open) return;
    if (searchable) {
      search.current?.focus({ preventScroll: true });
      search.current?.select();
    } else {
      const option = menu.current?.querySelector<HTMLButtonElement>(
        "[role=option]:not(:disabled)",
      );
      (option ?? menu.current)?.focus({ preventScroll: true });
    }
  }, [open, searchable]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (
        !root.current?.contains(e.target as Node) &&
        !menu.current?.contains(e.target as Node)
      )
        close();
    };
    const resized = () => close();
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", resized);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", resized);
    };
  }, [open]);
  useEffect(() => {
    if (disabled) close();
  }, [disabled]);
  function key(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
      return;
    }
    if (searchable && e.target === search.current) {
      if (e.nativeEvent.isComposing) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (!queryEdited) {
          close(true);
        } else {
          const option = options.find((item) => !item.disabled);
          if (option) {
            choose(option.value);
            close(true);
          }
        }
        return;
      }
      if (!["ArrowDown", "ArrowUp"].includes(e.key)) return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    if (!open) {
      openMenu();
      return;
    }
    const buttons = [
      ...(menu.current?.querySelectorAll<HTMLButtonElement>("[role=option]") ||
        []),
    ];
    const visual = (
      up && !searchable ? [...buttons.slice(1), buttons[0]] : buttons
    ).filter((button) => !button.disabled);
    if (visual.length === 0) return;
    const index = visual.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? visual.length - 1
          : (index < 0
              ? e.key === "ArrowUp"
                ? visual.length - 1
                : 0
              : index + (e.key === "ArrowUp" ? -1 : 1) + visual.length) %
            visual.length;
    visual[next]?.focus({ preventScroll: true });
    visual[next]?.scrollIntoView({ block: "nearest" });
  }
  return (
    <div
      ref={root}
      className={`${styles.value_menu} value-menu`}
      data-variant={variant}
      data-value={value}
      onKeyDown={key}
      onBlur={(e) => {
        if (
          !e.currentTarget.contains(e.relatedTarget as Node | null) &&
          !menu.current?.contains(e.relatedTarget as Node | null)
        )
          close();
      }}
    >
      <Button
        type="button"
        className="setting-trigger"
        data-muted={!!isMuted}
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-controls={searchable ? `${id}-results` : id}
        aria-expanded={open}
        disabled={disabled}
        title={disabled ? disabledReason : text}
        onClick={() => (open ? close() : openMenu())}
      >
        <ValueIcon icon={selected?.icon} />
        <span className="meta-value">{text}</span>
      </Button>
      {open &&
        createPortal(
          <div
            ref={menu}
            id={id}
            data-variant={variant}
            data-searchable={searchable}
            className={`${styles.setting_menu} ${dialogStyles.entrance} setting-menu ${up ? "opens-up" : ""}`}
            data-enter-effect="fade"
            onPointerDownCapture={(event) => {
              // Non-interactive rows must not blur the focused option/search field.
              if (
                event.target instanceof Element &&
                (event.target.closest("button:disabled") ||
                  event.target.getAttribute("role") === "separator" ||
                  event.target.closest(`.${styles.groupTitle}`))
              )
                event.preventDefault();
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              key(e);
            }}
            onBlur={(e) => {
              if (
                !root.current?.contains(e.relatedTarget as Node | null) &&
                !e.currentTarget.contains(e.relatedTarget as Node | null)
              )
                close();
            }}
            role={searchable ? "group" : "listbox"}
            tabIndex={-1}
            aria-label={t("{label} choices", { label })}
          >
            {searchable ? (
              <div className="setting-current setting-search-row">
                <ValueIcon icon={selected?.icon} />
                <input
                  ref={search}
                  className="setting-search"
                  aria-label={t("Search {label}", { label })}
                  role="combobox"
                  aria-expanded="true"
                  aria-autocomplete="list"
                  aria-controls={`${id}-results`}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setQueryEdited(true);
                  }}
                />
              </div>
            ) : (
              <Button
                type="button"
                className="setting-current"
                data-option-value={value}
                data-muted={!!isMuted}
                role="option"
                tabIndex={-1}
                aria-selected="true"
                disabled={selected?.disabled}
                onClick={() => close(true)}
              >
                <ValueIcon icon={selected?.icon} />
                <span className="meta-value">{text}</span>
              </Button>
            )}
            <div className={`${styles.choices} ${dialogStyles.entrance}`}>
              <div className="setting-divider" role="separator" />
              <div
                className="setting-options"
                id={`${id}-results`}
                role={searchable ? "listbox" : undefined}
                aria-label={
                  searchable ? t("{label} choices", { label }) : undefined
                }
              >
                {searchable && options.length === 0 && (
                  <p role="status">{t("No matches")}</p>
                )}
                {visibleSections.map((section, sectionIndex) => (
                  <Fragment key={section.index}>
                    {sectionIndex > 0 && (
                      <div className="setting-divider" role="separator" />
                    )}
                    <div
                      role="group"
                      aria-labelledby={
                        section.label
                          ? `${id}-group-${section.index}`
                          : undefined
                      }
                    >
                      {section.label && (
                        <span
                          id={`${id}-group-${section.index}`}
                          className={styles.groupTitle}
                        >
                          <ValueIcon icon={section.icon} />
                          <span className={styles.groupTitleText}>
                            {section.label}
                          </span>
                        </span>
                      )}
                      {section.items.map((choice, itemIndex) => (
                        <Fragment key={choice.value}>
                          {choice.separatorBefore && itemIndex > 0 && (
                            <div className="setting-divider" role="separator" />
                          )}
                          <Button
                            data-option-value={choice.value}
                            type="button"
                            role="option"
                            tabIndex={-1}
                            aria-selected={choice.value === value}
                            disabled={choice.disabled}
                            title={choice.label}
                            data-muted={!!choice.muted}
                            onClick={() => {
                              close(true);
                              choose(choice.value);
                            }}
                          >
                            <ValueIcon icon={choice.icon} />
                            <ValueLabel
                              option={choice}
                              query={searchable && queryEdited ? query : ""}
                            />
                          </Button>
                        </Fragment>
                      ))}
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>,
          root.current?.closest("dialog[open]") ?? document.body,
        )}
    </div>
  );
}

function ValueIcon({ icon }: { icon?: ReactNode }) {
  return icon ? (
    <span className={styles.icon} aria-hidden="true">
      {icon}
    </span>
  ) : null;
}

function ValueLabel({ option, query }: { option: ValueOption; query: string }) {
  const source = `${option.label} ${option.searchText ?? ""}`;
  const ranges = matchValueQuery(source, query) ?? [];
  // Show the alias only when it contributed to matching, so hidden metadata
  // never produces an unexplained result without any highlighted characters.
  const text = ranges.some((range) => range.end > option.label.length)
    ? source
    : option.label;
  const parts = [];
  let from = 0;
  for (const { start, end } of ranges) {
    parts.push(text.slice(from, start));
    parts.push(<mark key={start}>{text.slice(start, end)}</mark>);
    from = end;
  }
  parts.push(text.slice(from));
  return <span className="setting-match-label">{parts}</span>;
}
