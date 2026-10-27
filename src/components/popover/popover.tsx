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
};

// Fixed portal placement keeps a hint clear of a card or scroll area's clipping.
export function Popover({
  content,
  children,
  anchor: externalAnchor,
  open: controlledOpen,
  onOpenChange,
  placement = "top-start",
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
  useLayoutEffect(() => {
    const sourceAnchor = externalAnchor ?? anchor.current;
    if (!open || !sourceAnchor || !hint.current) return;
    const element = hint.current;
    const place = () => {
      element.style.maxWidth = "";
      for (const property of [
        "font",
        "color",
        "letter-spacing",
        "font-feature-settings",
        "font-variant-numeric",
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
            setPosition({ left, top, maxWidth, ...typography });
            return;
          }
        }
      }
      const rect = sourceAnchor.getBoundingClientRect();
      const box = element.getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
      if (placement !== "adjacent" && placement !== "in-place") {
        setPosition(
          hintPosition(
            rect,
            box,
            placement,
            { width: innerWidth, height: innerHeight },
            gap,
          ),
        );
        return;
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
      setPosition({ top, left });
    };
    place();
    if (placement === "in-place") return;
    const observer = new ResizeObserver(place);
    observer.observe(element);
    observer.observe(sourceAnchor);
    return () => observer.disconnect();
  }, [open, content, placement, externalAnchor]);
  useLayoutEffect(() => {
    if (!open || !externalAnchor) return;
    const previous = externalAnchor.getAttribute("aria-describedby");
    const next = [...new Set([...(previous?.split(/\s+/) ?? []), id])].join(
      " ",
    );
    externalAnchor.setAttribute("aria-describedby", next);
    return () => {
      if (externalAnchor.getAttribute("aria-describedby") !== next) return;
      if (previous) externalAnchor.setAttribute("aria-describedby", previous);
      else externalAnchor.removeAttribute("aria-describedby");
    };
  }, [open, externalAnchor, id]);
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
  }, [open, setOpen]);
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
          onPointerLeave={() => {
            if (!anchor.current?.contains(document.activeElement))
              setOpen(false);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
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
            role="tooltip"
            data-placement={placement}
            className={styles.hint}
            style={{ ...position, visibility: position ? "visible" : "hidden" }}
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
