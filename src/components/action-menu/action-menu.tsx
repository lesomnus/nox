import styles from "./action-menu.module.css";
import dialogStyles from "../dialog-surface/dialog-surface.module.css";
import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { Button } from "../button/button";
import { MenuSurface } from "../menu-surface/menu-surface";
import {
  MenuFrame,
  menuFixedHeight,
  hasMenuRegion,
} from "../menu-surface/menu-frame";
import { MenuScrollArea } from "../menu-surface/menu-scroll-area";
import { useUI } from "../../providers/ui-provider";
import {
  MenuDivider,
  MenuGroupLabel,
  MenuItem,
} from "../menu-surface/menu-item";

export type MenuMotionDirection =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";
export type ActionMenuMotion =
  | boolean
  | `from-${MenuMotionDirection}`
  | {
      from: MenuMotionDirection;
      effect: "slide" | "reveal";
    };

export type ActionMenuItem = {
  label: string;
  icon?: ReactNode;
  shortcut?: string | readonly string[];
  checked?: boolean;
  disabled?: boolean;
  danger?: boolean;
  run: (trigger: HTMLButtonElement) => void;
};

export function ActionMenu({
  label,
  items = [],
  groups,
  header,
  footer,
  disabled = false,
  placement = "below",
  gap: requestedGap = 4,
  motion = false,
  position: customPosition,
  status,
  triggerContent,
  disabledReason,
  triggerClassName = "",
  scrollbarOffset,
}: {
  label: string;
  /** Always visible above/below the scrolling action list. */
  header?: ReactNode;
  footer?: ReactNode;
  items?: ActionMenuItem[];
  groups?: { label: string; items: ActionMenuItem[] }[];
  disabled?: boolean;
  placement?: "above" | "below" | "right";
  /** Space in pixels between the trigger and automatically positioned popup. */
  gap?: number | ((trigger: HTMLButtonElement) => number);
  /** Override popup origin; viewport bounds are still enforced. */
  position?: (trigger: DOMRect) => { left: number; top: number };
  /** Entrance direction is independent of popup placement. True uses the default. */
  motion?: ActionMenuMotion;
  status?: string;
  /** Custom trigger content; defaults to the More (ellipsis) icon. */
  triggerContent?: ReactNode;
  disabledReason?: string;
  triggerClassName?: string;
  /** Signed handle-center offset, forwarded to the scrolling action list. */
  scrollbarOffset?: number;
}) {
  const offset = Number.isFinite(scrollbarOffset) ? scrollbarOffset : undefined;
  const { t } = useUI();
  const hasHeader = hasMenuRegion(header);
  const hasFooter = hasMenuRegion(footer);
  const hasRegions = hasHeader || hasFooter;
  const reveal = typeof motion === "object" && motion.effect === "reveal";
  const direction =
    typeof motion === "object"
      ? `from-${motion.from}`
      : typeof motion === "string"
        ? motion
        : undefined;
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  function close(restore = false) {
    setOpen(false);
    if (restore)
      trigger.current?.querySelector("button")?.focus({ preventScroll: true });
  }
  useLayoutEffect(() => {
    if (!open || !menu.current) return;
    const popup = menu.current;
    const position = () => {
      const button = trigger.current!.querySelector("button")!;
      const bounds = button.getBoundingClientRect();
      const gap =
        typeof requestedGap === "function"
          ? requestedGap(button)
          : requestedGap;
      const inset = 8;
      const outside = Math.max(0, offset ?? 0);
      const rightInset = inset + outside;
      const style = getComputedStyle(popup);
      const chrome =
        parseFloat(style.paddingTop) +
        parseFloat(style.paddingBottom) +
        parseFloat(style.borderTopWidth) +
        parseFloat(style.borderBottomWidth);
      const fixed = menuFixedHeight(popup);
      const maxViewport =
        parseFloat(style.getPropertyValue("--ui-menu-scroll-max-height")) ||
        window.innerHeight;
      const preferredHeight =
        Math.min(viewport.current?.scrollHeight ?? 0, maxViewport) +
        chrome +
        fixed;
      const constrainHeight = (available: number) => {
        popup.style.maxHeight = `${Math.max(0, available)}px`;
        popup.style.setProperty(
          "--menu-scroll-max-height",
          `${Math.max(0, available - chrome - fixed)}px`,
        );
      };
      popup.style.bottom = "auto";
      if (customPosition) {
        const origin = customPosition(bounds);
        constrainHeight(window.innerHeight - 8);
        popup.style.left = `${Math.max(4, Math.min(origin.left, window.innerWidth - popup.offsetWidth - 4 - outside))}px`;
        popup.style.top = `${Math.max(4, Math.min(origin.top, window.innerHeight - popup.offsetHeight - 4))}px`;
        return;
      }
      if (placement === "right") {
        constrainHeight(window.innerHeight - 2 * inset);
        popup.style.left = `${Math.max(inset, Math.min(bounds.right + gap, window.innerWidth - popup.offsetWidth - rightInset))}px`;
        popup.style.top = `${Math.max(inset, Math.min(bounds.bottom - popup.offsetHeight, window.innerHeight - popup.offsetHeight - inset))}px`;
        return;
      }
      const above = Math.max(0, bounds.top - gap - inset);
      const below = Math.max(
        0,
        window.innerHeight - bounds.bottom - gap - inset,
      );
      const upward =
        placement === "above"
          ? above >= preferredHeight || above > below
          : below < preferredHeight && above > below;
      constrainHeight(Math.min(window.innerHeight / 2, upward ? above : below));
      // Anchor the near edge directly: content/font changes must not alter the gap.
      popup.style.top = upward ? "auto" : `${bounds.bottom + gap}px`;
      popup.style.bottom = upward
        ? `${window.innerHeight - bounds.top + gap}px`
        : "auto";
      // A trigger near the left edge cannot keep a wide menu right-aligned.
      // Bound both edges after measuring the popup's actual width.
      const right = Math.max(rightInset, window.innerWidth - bounds.right);
      popup.style.right = `${Math.min(right, Math.max(rightInset, window.innerWidth - popup.offsetWidth - inset))}px`;
    };
    position();
    if (offset !== undefined) {
      const frame = popup.querySelector<HTMLElement>("[data-menu-frame]");
      if (
        frame &&
        frame
          .getAnimations()
          .every((animation) => animation.playState === "finished")
      )
        frame.style.maskImage = "none";
    }
    popup
      .querySelector<HTMLElement>(
        'input:not(:disabled), button:not(:disabled), [tabindex="0"]',
      )
      ?.focus({ preventScroll: true });
    const resize = new ResizeObserver(position);
    resize.observe(popup);
    // Fixed-region controls can resize the editor surrounding the trigger.
    for (
      let node: HTMLElement | null = trigger.current;
      node;
      node = node.parentElement
    )
      resize.observe(node);
    popup
      .querySelectorAll<HTMLElement>("[data-menu-fixed]")
      .forEach((region) => resize.observe(region));
    const scrolled = (event: Event) => {
      if (!popup.contains(event.target as Node)) position();
    };
    window.addEventListener("scroll", scrolled, true);
    return () => {
      resize.disconnect();
      window.removeEventListener("scroll", scrolled, true);
    };
  }, [
    open,
    placement,
    requestedGap,
    customPosition,
    hasHeader,
    hasFooter,
    offset,
  ]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !menu.current?.contains(target))
        close();
    };
    const resize = () => close();
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", resize);
    };
  }, [open]);
  return (
    <div className={`${styles.action_menu} action-menu`} ref={trigger}>
      <Button
        variant={triggerContent === undefined ? "toolbar" : "default"}
        className={`toolbar-button ${triggerClassName}`}
        type="button"
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        aria-label={label}
        aria-description={status}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? (hasRegions ? `${id}-items` : id) : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {triggerContent ?? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            aria-hidden="true"
            fill="currentColor"
          >
            <circle cx="4" cy="9" r="1.5" />
            <circle cx="9" cy="9" r="1.5" />
            <circle cx="14" cy="9" r="1.5" />
          </svg>
        )}
      </Button>
      {open && (
        <MenuSurface
          anchor={trigger.current?.querySelector("button")}
          className={`${styles.action_menu_popup} ${motion ? dialogStyles.entrance : ""} action-menu-popup`}
          data-placement={placement}
          data-enter-from={direction}
          data-enter-effect={reveal ? "reveal-frame" : undefined}
          data-scrollbar-offset={offset}
          style={
            {
              "--action-menu-scrollbar-outset": `${Math.max(0, offset ?? 0)}px`,
            } as CSSProperties
          }
          ref={menu}
          id={id}
          role={hasRegions ? "group" : "menu"}
          aria-label={label}
          onBlur={(event) => {
            const target = event.relatedTarget as Node | null;
            if (
              !event.currentTarget.contains(target) &&
              !trigger.current?.contains(target)
            )
              close();
          }}
          onKeyDown={(event) => {
            if (event.defaultPrevented) return;
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              close(true);
            }
            if (
              event.target instanceof Element &&
              event.target.closest("[data-menu-fixed]")
            )
              return;
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
              event.preventDefault();
              const buttons = [
                ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
                  '[role="menuitem"]:not(:disabled), [role="menuitemcheckbox"]:not(:disabled)',
                ),
              ];
              const current = buttons.indexOf(
                document.activeElement as HTMLButtonElement,
              );
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? buttons.length - 1
                    : (current +
                        (event.key === "ArrowUp" ? -1 : 1) +
                        buttons.length) %
                      buttons.length;
              buttons[next]?.focus({ preventScroll: true });
              buttons[next]?.scrollIntoView({ block: "nearest" });
            }
          }}
        >
          <MenuFrame
            header={header}
            footer={footer}
            className={reveal ? dialogStyles.entrance : undefined}
            data-enter-from={direction}
            data-enter-effect={reveal ? "reveal" : undefined}
            onAnimationEnd={(event) => {
              if (offset !== undefined && event.target === event.currentTarget)
                event.currentTarget.style.maskImage = "none";
            }}
          >
            <MenuScrollArea
              scrollbarOffset={offset}
              viewportRef={viewport}
              id={hasRegions ? `${id}-items` : undefined}
              role={hasRegions ? "menu" : undefined}
              aria-label={hasRegions ? label : undefined}
              scrollbarLabel={t("Scroll {label}", { label })}
            >
              {(groups ?? [{ label: "", items }]).map((group, index) => (
                <Fragment key={group.label}>
                  {index > 0 && <MenuDivider />}
                  <div
                    className="action-menu-group"
                    role="group"
                    aria-label={group.label || undefined}
                  >
                    {group.label && (
                      <MenuGroupLabel
                        className="action-menu-group-title"
                        aria-hidden="true"
                      >
                        {group.label}
                      </MenuGroupLabel>
                    )}
                    {group.items.map((item) => (
                      <MenuItem
                        key={item.label}
                        type="button"
                        role={
                          item.checked === undefined
                            ? "menuitem"
                            : "menuitemcheckbox"
                        }
                        aria-checked={item.checked}
                        aria-label={item.label}
                        disabled={item.disabled}
                        data-danger={item.danger}
                        icon={item.icon}
                        trailing={
                          item.shortcut && (
                            <span className={styles.shortcut}>
                              {(typeof item.shortcut === "string"
                                ? [item.shortcut]
                                : item.shortcut
                              ).map((key, index) => (
                                <kbd key={index}>{key}</kbd>
                              ))}
                            </span>
                          )
                        }
                        onClick={(event) => {
                          close(true);
                          item.run(event.currentTarget);
                        }}
                      >
                        <span>{item.label}</span>
                      </MenuItem>
                    ))}
                  </div>
                </Fragment>
              ))}
              {status && <small role="status">{status}</small>}
            </MenuScrollArea>
          </MenuFrame>
        </MenuSurface>
      )}
    </div>
  );
}
