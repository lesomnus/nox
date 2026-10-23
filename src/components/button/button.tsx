import styles from "./button.module.css";
import {
  useButtonSparkle,
  type ButtonEffectOptions,
} from "./use-button-sparkle";
export type { ButtonEffectOptions } from "./use-button-sparkle";
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
  variant?: "default" | "solid" | "outline" | "toolbar";
  /** Press feedback. Defaults to sparkle; none uses the native variant background. */
  effect?: "sparkle" | "none";
  effectOptions?: ButtonEffectOptions;
  ref?: Ref<HTMLButtonElement>;
};

export function Button({
  children,
  pressTarget,
  loading = false,
  variant = "default",
  effect = "sparkle",
  effectOptions,
  className = "",
  onClick,
  ...props
}: ButtonProps) {
  const sparkle = useButtonSparkle(
    effect === "sparkle",
    !!(
      loading ||
      props.disabled ||
      props["aria-disabled"] === true ||
      props["aria-disabled"] === "true"
    ),
    effectOptions,
  );
  return (
    <button
      {...props}
      aria-busy={loading || props["aria-busy"]}
      aria-disabled={loading || props["aria-disabled"]}
      data-loading={loading || undefined}
      data-variant={variant}
      data-effect={effect}
      className={`${styles.button} ${className}`}
      onPointerDown={(event) => {
        props.onPointerDown?.(event);
        if (!event.defaultPrevented) sparkle.pointerDown(event);
      }}
      onPointerUp={(event) => {
        sparkle.pointerEnd(event);
        props.onPointerUp?.(event);
      }}
      onPointerCancel={(event) => {
        sparkle.pointerEnd(event);
        props.onPointerCancel?.(event);
      }}
      onLostPointerCapture={(event) => {
        sparkle.pointerEnd(event);
        props.onLostPointerCapture?.(event);
      }}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (!event.defaultPrevented) sparkle.keyDown(event);
      }}
      onKeyUp={(event) => {
        sparkle.keyUp(event);
        props.onKeyUp?.(event);
      }}
      onBlur={(event) => {
        sparkle.release();
        props.onBlur?.(event);
      }}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClick?.(event);
      }}
    >
      {sparkle.ink}
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
