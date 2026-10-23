import styles from "./button.module.css";
import {
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Hold the pressed state and sweep a soft highlight over the label. */
  loading?: boolean;
  pressTarget?: string;
  variant?: "default" | "toolbar";
  ref?: Ref<HTMLButtonElement>;
};

export function Button({
  children,
  pressTarget,
  loading = false,
  variant = "default",
  className = "",
  onClick,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      aria-busy={loading || props["aria-busy"]}
      aria-disabled={loading || props["aria-disabled"]}
      data-loading={loading || undefined}
      data-variant={variant}
      className={`${styles.button} ${className}`}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClick?.(event);
      }}
    >
      <ButtonContent pressTarget={pressTarget}>{children}</ButtonContent>
    </button>
  );
}

export function ButtonContent({
  children,
  pressTarget,
}: {
  children: ReactNode;
  pressTarget?: string;
}) {
  const content = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = pressTarget
      ? content.current?.querySelector<HTMLElement>(pressTarget)
      : content.current;
    if (!el) return;
    const resize = new ResizeObserver(([entry]) => {
      const longest = Math.max(
        entry.contentRect.width,
        entry.contentRect.height,
      );
      el.style.setProperty(
        "--press-scale",
        String(Math.max(0.95, 1 - 4 / (longest || 1))),
      );
    });
    resize.observe(el);
    return () => resize.disconnect();
  }, [pressTarget]);
  return (
    <span ref={content} className={`${styles.button_content} button-content`}>
      {children}
    </span>
  );
}
