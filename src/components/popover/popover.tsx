import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import styles from "./popover.module.css";
import { hintPosition, type PopoverPosition } from "./hint-position";

export type { PopoverPosition } from "./hint-position";
export type PopoverPlacement = PopoverPosition | "adjacent" | "in-place";

export type PopoverProps = {
  content: ReactNode;
  children?: ReactNode;
  anchor?: HTMLElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: PopoverPlacement;
  /** Keep the anchor's width; in-place expansion keeps its top edge too. */
  matchAnchorWidth?: boolean;
  /** Allow controls in the popover, retaining hover/focus across the portal. */
  interactive?: boolean;
  label?: string;
};

// Fixed portal placement keeps a hint clear of a card or scroll area's clipping.
export function Popover({
  content,
  children,
  anchor: externalAnchor,
  open: controlledOpen,
  onOpenChange,
  placement = "top-start",
  matchAnchorWidth = false,
  interactive = false,
  label,
}: PopoverProps) {
  const id = useId();
  const anchor = useRef<HTMLSpanElement>(null);
  const hint = useRef<HTMLSpanElement>(null);
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const external = externalAnchor !== undefined;
  const setOpen = useCallback(
    (value: boolean) => {
      if (controlledOpen === undefined) setLocalOpen(value);
      onOpenChange?.(value);
    },
    [controlledOpen, onOpenChange],
  );
  const [position, setPosition] = useState<CSSProperties>();
  const within = (target: EventTarget | null) =>
    target instanceof Node &&
    ((externalAnchor ?? anchor.current)?.contains(target) ||
      hint.current?.contains(target));
  const leave = (target: EventTarget | null) => {
    if (!within(target) && !within(document.activeElement)) setOpen(false);
  };
  useEffect(() => {
    if (!interactive || !externalAnchor) return;
    const enter = (event: PointerEvent) => {
      if (event.pointerType !== "touch") setOpen(true);
    };
    const focus = () => setOpen(true);
    const exit = (event: FocusEvent | PointerEvent) => {
      const target = event.relatedTarget;
      if (
        target instanceof Node &&
        (externalAnchor.contains(target) || hint.current?.contains(target))
      )
        return;
      if (
        externalAnchor.contains(document.activeElement) ||
        hint.current?.contains(document.activeElement)
      )
        return;
      setOpen(false);
    };
    externalAnchor.addEventListener("pointerenter", enter);
    externalAnchor.addEventListener("pointerleave", exit);
    externalAnchor.addEventListener("focusin", focus);
    externalAnchor.addEventListener("focusout", exit);
    return () => {
      externalAnchor.removeEventListener("pointerenter", enter);
      externalAnchor.removeEventListener("pointerleave", exit);
      externalAnchor.removeEventListener("focusin", focus);
      externalAnchor.removeEventListener("focusout", exit);
    };
  }, [interactive, externalAnchor, setOpen]);
  useLayoutEffect(() => {
    const sourceAnchor = externalAnchor ?? anchor.current;
    if (!open || !sourceAnchor || !hint.current) return;
    const element = hint.current;
    const measure = (): CSSProperties => {
      element.style.maxWidth = "";
      element.style.width = "";
      for (const property of [
        "font",
        "color",
        "letter-spacing",
        "font-feature-settings",
        "font-variant-numeric",
        "min-height",
        "padding",
        "border-radius",
      ])
        element.style.removeProperty(property);
      if (placement === "in-place") {
        const original = textLine(sourceAnchor);
        if (original) {
          const source = getComputedStyle(original.parent);
          const typography: CSSProperties = {
            font: source.font,
            color: source.color,
            letterSpacing: source.letterSpacing,
            fontFeatureSettings: source.fontFeatureSettings,
            fontVariantNumeric: source.fontVariantNumeric,
          };
          Object.assign(element.style, typography);
          if (matchAnchorWidth) {
            const rect = sourceAnchor.getBoundingClientRect();
            const frame = getComputedStyle(sourceAnchor);
            return {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              maxWidth: rect.width,
              minHeight: rect.height,
              padding: frame.padding,
              borderRadius: frame.borderRadius,
              ...typography,
            };
          }
          const expanded = textLine(element);
          if (expanded) {
            const frame = element.getBoundingClientRect();
            const left = frame.left + original.rect.left - expanded.rect.left;
            const top = frame.top + original.rect.top - expanded.rect.top;
            const inset =
              parseFloat(getComputedStyle(element).paddingInlineEnd) || 0;
            // Wrap at the viewport edge without moving the text's original origin.
            const maxWidth = `min(var(--hint-max-width), ${Math.max(0, innerWidth - left - inset)}px)`;
            element.style.maxWidth = maxWidth;
            return { left, top, maxWidth, ...typography };
          }
        }
      }
      const rect = sourceAnchor.getBoundingClientRect();
      if (matchAnchorWidth) element.style.width = `${rect.width}px`;
      const box = element.getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
      if (placement !== "adjacent" && placement !== "in-place") {
        return {
          ...hintPosition(
            rect,
            box,
            placement,
            { width: innerWidth, height: innerHeight },
            gap,
          ),
          ...(matchAnchorWidth ? { width: rect.width } : {}),
        };
      }
      const left = Math.max(
        gap,
        Math.min(innerWidth - box.width - gap, rect.left),
      );
      const below = rect.bottom + gap;
      const top =
        below + box.height <= innerHeight - gap
          ? below
          : Math.max(gap, rect.top - box.height - gap);
      return {
        top,
        left,
        ...(matchAnchorWidth ? { width: rect.width } : {}),
      };
    };
    const place = () => {
      // Measurement temporarily removes React's inline sizing. Restore it even
      // when the next position is unchanged: React won't rewrite equal styles.
      const previousStyle = element.style.cssText;
      try {
        setPosition(measure());
      } finally {
        element.style.cssText = previousStyle;
      }
    };
    place();
    if (placement === "in-place") return;
    const observer = new ResizeObserver(place);
    observer.observe(element);
    observer.observe(sourceAnchor);
    return () => observer.disconnect();
  }, [open, content, placement, externalAnchor, matchAnchorWidth]);
  useLayoutEffect(() => {
    if (!open || !externalAnchor) return;
    const attribute = interactive ? "aria-controls" : "aria-describedby";
    const previous = externalAnchor.getAttribute(attribute);
    const next = [...new Set([...(previous?.split(/\s+/) ?? []), id])].join(
      " ",
    );
    externalAnchor.setAttribute(attribute, next);
    return () => {
      if (externalAnchor.getAttribute(attribute) !== next) return;
      if (previous) externalAnchor.setAttribute(attribute, previous);
      else externalAnchor.removeAttribute(attribute);
    };
  }, [open, externalAnchor, id, interactive]);
  useLayoutEffect(() => {
    if (!open || !externalAnchor || placement !== "in-place" || !position)
      return;
    externalAnchor.classList.add(styles.sourceHidden);
    return () => externalAnchor.classList.remove(styles.sourceHidden);
  }, [open, externalAnchor, placement, !!position]);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (interactive && hint.current?.contains(document.activeElement))
          (externalAnchor ?? anchor.current)?.focus({ preventScroll: true });
        close();
      }
    };
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    document.addEventListener("keydown", escape, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      document.removeEventListener("keydown", escape, true);
    };
  }, [open, setOpen, interactive, externalAnchor]);
  return (
    <>
      {!external && (
        <span
          ref={anchor}
          className={styles.anchor}
          tabIndex={0}
          aria-describedby={open ? id : undefined}
          data-in-place-open={
            (open && placement === "in-place" && !!position) || undefined
          }
          onPointerEnter={(event) => {
            if (event.pointerType !== "touch") setOpen(true);
          }}
          onPointerLeave={(event) => {
            if (interactive) {
              leave(event.relatedTarget);
              return;
            }
            if (!anchor.current?.contains(document.activeElement))
              setOpen(false);
          }}
          onFocus={() => setOpen(true)}
          onBlur={(event) =>
            interactive ? leave(event.relatedTarget) : setOpen(false)
          }
        >
          {children}
        </span>
      )}
      {open &&
        (!external || externalAnchor) &&
        createPortal(
          <span
            ref={hint}
            id={id}
            role={interactive ? "dialog" : "tooltip"}
            aria-label={label}
            data-placement={placement}
            data-interactive={interactive || undefined}
            className={styles.hint}
            style={{ ...position, visibility: position ? "visible" : "hidden" }}
            onPointerEnter={interactive ? () => setOpen(true) : undefined}
            onPointerLeave={
              interactive ? (event) => leave(event.relatedTarget) : undefined
            }
            onFocus={interactive ? () => setOpen(true) : undefined}
            onBlur={
              interactive ? (event) => leave(event.relatedTarget) : undefined
            }
          >
            {content}
          </span>,
          (externalAnchor ?? anchor.current)?.closest("dialog[open]") ??
            document.body,
        )}
    </>
  );
}

// Measure the text line rather than an element's padding or line-height box.
function textLine(element: HTMLElement) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (!node.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getClientRects()[0];
    if (rect && node.parentElement) return { rect, parent: node.parentElement };
  }
}
