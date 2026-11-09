import { matchValueQuery, matchesValueQuery } from "./value-search";
import { positionSelectedMenu } from "./position-selected-menu";
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
import { MenuSurface } from "../menu-surface/menu-surface";
import {
  MenuFrame,
  menuFixedHeight,
  hasMenuRegion,
} from "../menu-surface/menu-frame";
import {
  MenuDivider,
  MenuGroupLabel,
  MenuIcon,
  MenuItem,
  type MenuItemProps,
} from "../menu-surface/menu-item";
import { Section } from "../section-layout/section-layout";
import { MenuScrollArea } from "../menu-surface/menu-scroll-area";
import { useMenuAction } from "../menu-surface/use-menu-action";
import { useUI } from "../../providers/ui-provider";

export type ValueOption = {
  value: string;
  label: string;
  /** Smaller secondary text below the label, for example a resource alias. */
  description?: string;
  /** Decorative content shown before the value label. */
  icon?: ReactNode;
  /** Content aligned to the right of the option and selected value. */
  trailing?: ReactNode;
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

// The current-value row overlays the trigger text exactly. A portal avoids clipping
// inside settings panes while sharing the composer menu's focus and geometry.
export function ValueMenu({
  label,
  display,
  renderLabel,
  value,
  options: items = [],
  groups,
  header,
  footer,
  muted = false,
  minMenuWidth = 140,
  variant = "default",
  disabled,
  dirty = false,
  disabledReason,
  choose,
  searchable = false,
  hideSelected = false,
  alignItemWithTrigger = false,
  awaitAction = false,
  scrollbarOffset,
  scrollbarSide,
}: {
  label: string;
  /** Always visible above/below the value rows, regardless of opening direction. */
  header?: ReactNode;
  footer?: ReactNode;
  display?: string;
  /** Custom visual label for the trigger and options; string labels remain accessible and searchable. */
  renderLabel?: (option: ValueOption) => ReactNode;
  value: string;
  options?: ValueOption[];
  /** Titled/untitled sections; when supplied, these replace options. */
  groups?: ValueOptionGroup[];
  muted?: boolean;
  minMenuWidth?: number;
  variant?: "default" | "compact" | "section";
  disabled?: boolean;
  /** Whether the selected value differs from the caller's saved value. */
  dirty?: boolean;
  disabledReason?: string;
  choose: (value: string) => unknown;
  /** Await choose before closing; rejection keeps feedback on the chosen option. */
  awaitAction?: boolean;
  /** Open a focused, empty search field with the current display value as its placeholder. */
  searchable?: boolean;
  /** Exclude the selected value from choices; the aligned current/search row stays. */
  hideSelected?: boolean;
  /** Align the selected option itself; search/hidden/missing selections use the current-row layout. */
  alignItemWithTrigger?: boolean;
  /** Vertical scrollbar placement, forwarded to ScrollArea. */
  scrollbarSide?: "left" | "right";
  /** Handle-center offset in pixels: positive inside, negative outside. */
  scrollbarOffset?: number;
}) {
  const { t } = useUI();
  const offset = Number.isFinite(scrollbarOffset) ? scrollbarOffset : undefined;
  const Row = variant === "section" ? SectionMenuItem : MenuItem;
  const hasHeader = hasMenuRegion(header);
  const hasFooter = hasMenuRegion(footer);
  const hasRegions = hasHeader || hasFooter;
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const [query, setQuery] = useState("");
  const [queryEdited, setQueryEdited] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(true);
  const [itemAligned, setItemAligned] = useState(false);
  const action = useMenuAction(awaitAction, close);
  const sections = groups ?? [{ items }];
  const selected = sections
    .flatMap((section) => section.items)
    .find((item) => item.value === value);
  const text = display ?? selected?.label ?? value;
  const currentOption = { ...selected, value, label: text };
  const multiline = sections.some((section) =>
    section.items.some((item) => !!item.description),
  );
  const alignItem =
    alignItemWithTrigger && !searchable && !hideSelected && !!selected;
  const itemAnchor = alignItem ? value : undefined;
  const isMuted = muted || selected?.muted;
  const visibleSections = sections
    .map((section, index) => ({
      ...section,
      index,
      items: section.items.filter(
        (item) =>
          (!hideSelected || item.value !== value) &&
          (!searchable ||
            !queryEdited ||
            matchesValueQuery(optionSearchText(item), query)),
      ),
    }))
    .filter((section) => section.items.length > 0);
  const options = visibleSections.flatMap((section) => section.items);
  const trigger = () =>
    root.current?.querySelector<HTMLButtonElement>(".setting-trigger");
  function openMenu() {
    setQuery("");
    setQueryEdited(false);
    setOpen(true);
  }
  function close(restore = false) {
    action.clear();
    setOpen(false);
    setItemAligned(false);
    setQuery("");
    if (restore) trigger()?.focus({ preventScroll: true });
  }
  useLayoutEffect(() => {
    if (!open || !root.current || !menu.current) return;
    const position = () => {
      if (!root.current || !menu.current) return;
      if (alignItem && trigger()) {
        setItemAligned(
          positionSelectedMenu(menu.current, trigger()!, minMenuWidth),
        );
        return;
      }
      setItemAligned(false);
      const rect = root.current.getBoundingClientRect();
      const popup = menu.current;
      const currentRow = popup.querySelector<HTMLElement>(".setting-current");
      const control = trigger();
      if (currentRow && control) {
        const controlStyle = getComputedStyle(control);
        currentRow.style.padding = controlStyle.padding;
        currentRow.style.height = controlStyle.height;
        currentRow.style.minHeight = controlStyle.minHeight;
      }
      const style = getComputedStyle(popup);
      const inset =
        parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth);
      const chrome = rect.height + 2 * inset + 13;
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
      const fixed = menuFixedHeight(popup);
      const height = chrome + fixed + (list?.scrollHeight ?? 0);
      const upwards = rect.top + height > window.innerHeight;
      setUp(upwards);
      popup.style.left = `${Math.min(rect.left - inset, window.innerWidth - parseFloat(popup.style.getPropertyValue("--menu-width")) - inset)}px`;
      popup.style.top = upwards ? "auto" : `${rect.top - inset}px`;
      popup.style.bottom = upwards
        ? `${window.innerHeight - rect.bottom - inset}px`
        : "auto";
      popup.style.setProperty(
        "--options-height",
        `${Math.max(hasRegions ? 0 : rect.height, (upwards ? rect.bottom : window.innerHeight - rect.top) - chrome - fixed)}px`,
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
      if (hasRegions) {
        const bounds = popup.getBoundingClientRect();
        const shift = Math.max(
          8 - bounds.top,
          Math.min(0, window.innerHeight - 8 - bounds.bottom),
        );
        if (upwards)
          popup.style.bottom = `${parseFloat(popup.style.bottom) - shift}px`;
        else popup.style.top = `${parseFloat(popup.style.top) + shift}px`;
      }
    };
    position();
    const resize = new ResizeObserver(position);
    resize.observe(menu.current);
    for (
      let node: HTMLElement | null = root.current;
      node;
      node = node.parentElement
    )
      resize.observe(node);
    menu.current
      .querySelectorAll<HTMLElement>("[data-menu-fixed]")
      .forEach((region) => resize.observe(region));
    const scrolled = (e: Event) => {
      if (!menu.current?.contains(e.target as Node)) position();
    };
    document.addEventListener("scroll", scrolled, true);
    return () => {
      resize.disconnect();
      document.removeEventListener("scroll", scrolled, true);
    };
  }, [
    open,
    items,
    groups,
    query,
    queryEdited,
    minMenuWidth,
    searchable,
    up,
    hasHeader,
    hasFooter,
    hideSelected,
    alignItem,
    itemAnchor,
  ]);
  useLayoutEffect(() => {
    if (!open) return;
    if (searchable) {
      search.current?.focus({ preventScroll: true });
    } else {
      const selected = menu.current?.querySelector<HTMLButtonElement>(
        '[role=option][aria-selected="true"]',
      );
      if (alignItem && selected?.disabled) {
        menu.current?.focus({ preventScroll: true });
        return;
      }
      const option =
        menu.current?.querySelector<HTMLButtonElement>(
          '[role=option][aria-selected="true"]:not(:disabled)',
        ) ??
        menu.current?.querySelector<HTMLButtonElement>(
          "[role=option]:not(:disabled)",
        );
      (option ?? menu.current)?.focus({ preventScroll: true });
      option?.scrollIntoView({ block: "nearest" });
    }
  }, [open, searchable, alignItem, itemAnchor]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (
        !root.current?.contains(e.target as Node) &&
        !menu.current?.contains(e.target as Node) &&
        !action.containsFeedback(e.target as Node)
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
    // ScrollArea handles its own scrollbar keyboard navigation.
    if (e.defaultPrevented) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
      return;
    }
    if (e.target instanceof Element && e.target.closest("[data-menu-fixed]"))
      return;
    if (searchable && e.target === search.current) {
      if (e.nativeEvent.isComposing) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (!queryEdited) {
          close(true);
        } else {
          const option = options.find((item) => !item.disabled);
          if (option) {
            if (option.value === value) close(true);
            else {
              const row = menu.current?.querySelector<HTMLElement>(
                `[role="option"][data-option-value="${CSS.escape(option.value)}"]`,
              );
              row?.focus({ preventScroll: true });
              action.invoke(
                () => choose(option.value),
                row ?? search.current!,
                option.value,
              );
            }
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
    const visual = buttons.filter((button) => !button.disabled);
    if (visual.length === 0) return;
    const index = visual.indexOf(document.activeElement as HTMLButtonElement);
    if (alignItem && index < 0 && ["ArrowDown", "ArrowUp"].includes(e.key)) {
      const anchor = buttons.findIndex(
        (button) => button.getAttribute("aria-selected") === "true",
      );
      const ordered =
        e.key === "ArrowUp"
          ? buttons.slice(0, anchor).reverse()
          : buttons.slice(anchor + 1);
      const next =
        ordered.find((button) => !button.disabled) ??
        (e.key === "ArrowUp" ? visual.at(-1) : visual[0]);
      next?.focus({ preventScroll: true });
      next?.scrollIntoView({ block: "nearest" });
      return;
    }
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
      data-multiline={multiline || undefined}
      data-value={value}
      data-dirty={dirty || undefined}
      data-item-aligned={(open && itemAligned) || undefined}
      onKeyDown={key}
      onBlur={(e) => {
        if (action.isRunning()) return;
        if (
          !e.currentTarget.contains(e.relatedTarget as Node | null) &&
          !menu.current?.contains(e.relatedTarget as Node | null) &&
          !action.containsFeedback(e.relatedTarget as Node | null)
        )
          close();
      }}
    >
      <Row
        type="button"
        className="setting-trigger"
        icon={selected?.icon}
        trailing={selected?.trailing}
        data-muted={!!isMuted}
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-controls={`${id}-results`}
        aria-expanded={open}
        disabled={disabled}
        title={disabled ? disabledReason : text}
        onClick={() => (open ? close() : openMenu())}
      >
        <ValueLabel
          option={currentOption}
          query=""
          className="meta-value"
          renderLabel={renderLabel}
        />
      </Row>
      {open && (
        <MenuSurface
          anchor={trigger()}
          ref={menu}
          id={id}
          data-variant={variant}
          data-multiline={multiline || undefined}
          data-searchable={searchable}
          data-scrollbar-offset={offset}
          data-align-item-with-trigger={alignItem || undefined}
          className={`${styles.setting_menu} ${dialogStyles.entrance} setting-menu ${!alignItem && up ? "opens-up" : ""}`}
          data-enter-effect={itemAligned ? "anchored" : "fade"}
          onPointerDownCapture={(event) => {
            // Non-interactive rows must not blur the focused option/search field.
            if (
              event.target instanceof Element &&
              (event.target.closest("button:disabled") ||
                event.target.getAttribute("role") === "separator" ||
                event.target.closest("[data-menu-group-label]"))
            )
              event.preventDefault();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            key(e);
          }}
          onBlur={(e) => {
            if (action.isRunning()) return;
            if (
              !root.current?.contains(e.relatedTarget as Node | null) &&
              !e.currentTarget.contains(e.relatedTarget as Node | null) &&
              !action.containsFeedback(e.relatedTarget as Node | null)
            )
              close();
          }}
          role="group"
          tabIndex={-1}
          aria-label={t("{label} choices", { label })}
        >
          <MenuFrame header={header} footer={footer}>
            {searchable ? (
              <div className="setting-current setting-search-row">
                <MenuIcon icon={selected?.icon} />
                <input
                  ref={search}
                  className="setting-search"
                  aria-label={t("Search {label}", { label })}
                  role="combobox"
                  aria-expanded="true"
                  aria-autocomplete="list"
                  aria-controls={`${id}-results`}
                  value={query}
                  placeholder={text}
                  readOnly={action.pending}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setQueryEdited(true);
                  }}
                />
              </div>
            ) : !alignItem ? (
              <Row
                type="button"
                className="setting-current"
                icon={selected?.icon}
                trailing={selected?.trailing}
                data-option-value={value}
                data-muted={!!isMuted}
                tabIndex={-1}
                disabled={selected?.disabled || action.pending}
                onClick={() => close(true)}
              >
                <ValueLabel
                  option={currentOption}
                  query=""
                  className="meta-value"
                  renderLabel={renderLabel}
                />
              </Row>
            ) : null}
            <div
              className={`${styles.choices} ${alignItem ? "" : dialogStyles.entrance}`}
            >
              {!alignItem && <MenuDivider className="setting-divider" />}
              <MenuScrollArea
                viewportClassName="setting-options"
                scrollbarSide={scrollbarSide}
                scrollbarOffset={offset}
                scrollbarLabel={t("Scroll {label} choices", { label })}
                id={`${id}-results`}
                role="listbox"
                aria-label={t("{label} choices", { label })}
              >
                {(searchable || alignItem) && options.length === 0 && (
                  <p className={styles.emptyState} role="status">
                    {t("No matches")}
                  </p>
                )}
                {visibleSections.map((section, sectionIndex) => (
                  <Fragment key={section.index}>
                    {sectionIndex > 0 && (
                      <MenuDivider className="setting-divider" />
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
                        <MenuGroupLabel
                          id={`${id}-group-${section.index}`}
                          icon={section.icon}
                        >
                          {section.label}
                        </MenuGroupLabel>
                      )}
                      {section.items.map((choice, itemIndex) => (
                        <Fragment key={choice.value}>
                          {choice.separatorBefore && itemIndex > 0 && (
                            <MenuDivider className="setting-divider" />
                          )}
                          <Row
                            data-option-value={choice.value}
                            type="button"
                            role="option"
                            tabIndex={-1}
                            aria-selected={choice.value === value}
                            aria-label={renderLabel ? choice.label : undefined}
                            aria-description={
                              renderLabel ? choice.description : undefined
                            }
                            disabled={
                              choice.disabled ||
                              (action.pending &&
                                action.activeKey !== choice.value)
                            }
                            loading={
                              action.pending &&
                              action.activeKey === choice.value
                            }
                            title={choice.label}
                            icon={choice.icon}
                            trailing={choice.trailing}
                            data-muted={!!choice.muted}
                            onClick={(event) => {
                              if (choice.value === value) close(true);
                              else
                                action.invoke(
                                  () => choose(choice.value),
                                  event.currentTarget,
                                  choice.value,
                                );
                            }}
                          >
                            <ValueLabel
                              option={choice}
                              query={searchable && queryEdited ? query : ""}
                              renderLabel={renderLabel}
                            />
                          </Row>
                        </Fragment>
                      ))}
                    </div>
                  </Fragment>
                ))}
              </MenuScrollArea>
            </div>
          </MenuFrame>
          {action.feedback}
        </MenuSurface>
      )}
    </div>
  );
}

export type ValueMenuProps = Parameters<typeof ValueMenu>[0];

function SectionMenuItem({
  icon,
  trailing,
  children,
  className = "",
  ...props
}: MenuItemProps) {
  return (
    <Section
      as="button"
      {...props}
      className={`${styles.sectionItem} ${className}`}
    >
      <MenuIcon icon={icon} />
      {children}
      {trailing != null && typeof trailing !== "boolean" && (
        <span className={styles.sectionTrailing}>{trailing}</span>
      )}
    </Section>
  );
}

function optionSearchText(option: ValueOption) {
  return `${option.label}${option.description ? ` ${option.description}` : ""} ${option.searchText ?? ""}`;
}

function ValueLabel({
  option,
  query,
  className = "setting-match-label",
  renderLabel,
}: {
  option: ValueOption;
  query: string;
  className?: string;
  renderLabel?: (option: ValueOption) => ReactNode;
}) {
  if (renderLabel)
    return (
      <span className={`${styles.label} ${className}`}>
        {renderLabel(option)}
      </span>
    );
  const source = optionSearchText(option);
  const ranges = matchValueQuery(source, query) ?? [];
  // Reveal hidden search metadata only when it contributed to matching. Visible
  // descriptions keep their own second line and highlight matching characters.
  const metadataStart =
    option.label.length +
    (option.description ? option.description.length + 1 : 0) +
    1;
  const showMetadata = ranges.some((range) => range.end > metadataStart);
  const highlight = (text: string, offset: number) => {
    const parts: ReactNode[] = [];
    let from = 0;
    for (const range of ranges) {
      const start = Math.max(0, range.start - offset);
      const end = Math.min(text.length, range.end - offset);
      if (start >= end) continue;
      parts.push(text.slice(from, start));
      parts.push(<mark key={start}>{text.slice(start, end)}</mark>);
      from = end;
    }
    parts.push(text.slice(from));
    return parts;
  };
  return (
    <span className={`${styles.label} ${className}`}>
      <span className={styles.primary}>
        {highlight(option.label, 0)}
        {showMetadata && (
          <> {highlight(option.searchText ?? "", metadataStart)}</>
        )}
      </span>
      {option.description && (
        <small className={styles.description}>
          {highlight(option.description, option.label.length + 1)}
        </small>
      )}
    </span>
  );
}
