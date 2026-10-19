import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import styles from "./overflow-hint.module.css";

// Fixed portal placement keeps a hint clear of a card or scroll area's clipping.
export function OverflowHint({
  content,
  children,
  placement = "adjacent",
}: {
  content: string;
  children: ReactNode;
  placement?: "adjacent" | "in-place";
}) {
  const id = useId();
  const anchor = useRef<HTMLSpanElement>(null);
  const hint = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>();
  useLayoutEffect(() => {
    if (!open || !anchor.current || !hint.current) return;
    const element = hint.current;
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
      const original = textLine(anchor.current);
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
    const rect = anchor.current.getBoundingClientRect();
    const box = hint.current.getBoundingClientRect();
    const gap =
      parseFloat(getComputedStyle(hint.current).paddingInlineStart) || 0;
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
  }, [open, content, placement]);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    document.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <>
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
          if (!anchor.current?.contains(document.activeElement)) setOpen(false);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
      {open &&
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
