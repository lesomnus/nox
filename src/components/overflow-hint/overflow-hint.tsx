import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./overflow-hint.module.css";

// Fixed portal placement keeps a hint clear of a card or scroll area's clipping.
export function OverflowHint({
  content,
  children,
}: {
  content: string;
  children: ReactNode;
}) {
  const id = useId();
  const anchor = useRef<HTMLSpanElement>(null);
  const hint = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>();
  useLayoutEffect(() => {
    if (!open || !anchor.current || !hint.current) return;
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
  }, [open, content]);
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
