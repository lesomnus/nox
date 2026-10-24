import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import styles from "./drawer.module.css";

export type DrawerSide = "left" | "right" | "top" | "bottom";
export type DrawerProps = Omit<ComponentProps<"dialog">, "open" | "onClose"> & {
  open: boolean;
  onClose: () => void;
  /** Called after exit, or if a visible drawer is unmounted. */
  onClosed?: () => void;
  side?: DrawerSide;
  /** Numbers are pixels; CSS lengths and percentages are also supported. */
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  /** Cross-axis alignment when the card does not fill the available space. */
  align?: "start" | "center" | "end";
  inset?: number | string;
  /** Bounds the visible overlay; modal focus still belongs to the whole page. */
  container?: HTMLElement | null;
  dismissible?: boolean;
  initialFocus?: RefObject<HTMLElement | null>;
  restoreFocus?: boolean;
  classNames?: Partial<Record<"frame" | "backdrop", string>>;
};

const length = (value: number | string | undefined) =>
  typeof value === "number" ? `${value}px` : value;

/** Directional modal placement and motion, independent of the card rendered inside. */
export function Drawer({
  open,
  onClose,
  onClosed,
  side = "right",
  width,
  height,
  align = "center",
  inset,
  container,
  dismissible = true,
  initialFocus,
  restoreFocus = true,
  classNames = {},
  className = "",
  children,
  style,
  ref,
  onCancel,
  onPointerDown,
  onClick,
  onKeyDown,
  ...props
}: DrawerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const outside = useRef(false);
  const lifecycle = useRef(0);
  const [present, setPresent] = useState(open);
  const visible = open || present;
  const latest = useRef({ onClosed, initialFocus, restoreFocus });
  useLayoutEffect(() => {
    latest.current = { onClosed, initialFocus, restoreFocus };
  });

  useLayoutEffect(() => {
    if (!visible) return;
    const generation = ++lifecycle.current;
    const node = dialog.current!;
    const origin =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : undefined;
    // Portals leave the host's typography scope. Preserve its text appearance,
    // following the same convention as MenuSurface rather than resetting it.
    const typography = getComputedStyle(container ?? origin ?? document.body);
    for (const property of [
      "fontFamily",
      "fontSize",
      "fontWeight",
      "fontStyle",
      "fontVariant",
      "fontFeatureSettings",
      "fontVariationSettings",
      "letterSpacing",
      "lineHeight",
    ] as const) {
      if (style?.[property] === undefined)
        node.style[property] = typography[property];
    }
    node.showModal();
    const target = latest.current.initialFocus?.current;
    if (target && node.contains(target)) target.focus({ preventScroll: true });
    return () => {
      node.close();
      // StrictMode may immediately attach the same modal again.
      queueMicrotask(() => {
        if (lifecycle.current !== generation) return;
        if (latest.current.restoreFocus && origin?.isConnected)
          origin.focus({ preventScroll: true });
        latest.current.onClosed?.();
      });
    };
  }, [visible]);

  useLayoutEffect(() => {
    if (!visible || !container) return;
    const node = dialog.current!;
    const position = () => {
      const bounds = container.getBoundingClientRect();
      const left = Math.max(0, bounds.left);
      const top = Math.max(0, bounds.top);
      Object.assign(node.style, {
        inset: "auto",
        left: `${left}px`,
        top: `${top}px`,
        width: `${Math.max(0, Math.min(innerWidth, bounds.right) - left)}px`,
        height: `${Math.max(0, Math.min(innerHeight, bounds.bottom) - top)}px`,
      });
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(container);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      for (const property of ["inset", "left", "top", "width", "height"])
        node.style.removeProperty(property);
    };
  }, [container, visible]);

  useLayoutEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }
    if (!present) return;
    let canceled = false;
    const animations = [
      ...frame.current!.getAnimations(),
      ...backdrop.current!.getAnimations(),
    ];
    // Wait only for our own exit, not animations in caller-provided content.
    void Promise.all(animations.map((a) => a.finished.catch(() => {}))).then(
      () => {
        if (!canceled) setPresent(false);
      },
    );
    return () => {
      canceled = true;
    };
  }, [open, present]);

  if (!visible) return null;
  return createPortal(
    <dialog
      {...props}
      ref={(node) => {
        dialog.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
      tabIndex={-1}
      className={`${styles.overlay} ${className}`}
      data-drawer="root"
      data-side={side}
      data-align={align}
      data-closing={!open}
      aria-hidden={!open || undefined}
      inert={!open}
      style={
        {
          "--drawer-width": length(width),
          "--drawer-height": length(height),
          "--drawer-inset": length(inset),
          ...style,
        } as CSSProperties
      }
      onClose={(event) => {
        if (event.currentTarget.isConnected && !event.currentTarget.open)
          onClose();
      }}
      onCancel={(event) => {
        onCancel?.(event);
        const canceled = event.defaultPrevented;
        event.preventDefault();
        if (!canceled && dismissible && open) onClose();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        outside.current =
          !event.defaultPrevented &&
          !frame.current?.contains(event.target as Node);
      }}
      onClick={(event) => {
        onClick?.(event);
        const dismiss = outside.current;
        outside.current = false;
        if (
          !event.defaultPrevented &&
          dismiss &&
          open &&
          dismissible &&
          !frame.current?.contains(event.target as Node)
        )
          onClose();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        event.stopPropagation();
        if (event.defaultPrevented || event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button, a[href], input, textarea, select, [tabindex], [contenteditable="true"]',
          ),
        ).filter(
          (node) =>
            (node.tabIndex >= 0 ||
              (node.isContentEditable && !node.hasAttribute("tabindex"))) &&
            !node.matches(":disabled") &&
            !node.closest("[inert]") &&
            node.getClientRects().length &&
            getComputedStyle(node).visibility !== "hidden",
        );
        const first = controls[0];
        const last = controls.at(-1);
        if (
          !first ||
          document.activeElement === event.currentTarget ||
          document.activeElement === (event.shiftKey ? first : last)
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus({ preventScroll: true });
          if (!first) event.currentTarget.focus({ preventScroll: true });
        }
      }}
    >
      <div
        ref={backdrop}
        className={`${styles.backdrop} ${classNames.backdrop ?? ""}`}
        data-drawer="backdrop"
        aria-hidden="true"
      />
      <div className={styles.positioner}>
        <div
          ref={frame}
          className={`${styles.frame} ${classNames.frame ?? ""}`}
          data-drawer="frame"
        >
          {children}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
