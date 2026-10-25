import styles from "./button.module.css";
import {
  useButtonSparkle,
  type ButtonEffectOptions,
} from "./use-button-sparkle";
export type { ButtonEffectOptions } from "./use-button-sparkle";
import {
  forwardRef,
  useLayoutEffect,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";

type ButtonAppearance = {
  pressTarget?: string;
  variant?: "default" | "solid" | "outline" | "toolbar";
  /** Press feedback. Defaults to sparkle; none uses the native variant background. */
  effect?: "sparkle" | "none";
  effectOptions?: ButtonEffectOptions;
};
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonAppearance & {
    /** Hold the pressed state and sweep a soft highlight over the label. */
    loading?: boolean;
    ref?: Ref<HTMLButtonElement>;
  };
export type ButtonAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  ButtonAppearance;

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
  const sparkle = useButtonSparkle<HTMLButtonElement>(
    effect === "sparkle",
    !!(
      loading ||
      props.disabled ||
      props["aria-disabled"] === true ||
      props["aria-disabled"] === "true"
    ),
    effectOptions,
    props,
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
      {...sparkle.events}
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

// Keep native link semantics (including modified clicks and Enter activation)
// while sharing the button surface, press motion and ink lifecycle.
export const ButtonAnchor = forwardRef<HTMLAnchorElement, ButtonAnchorProps>(
  function ButtonAnchor(
    {
      children,
      pressTarget,
      variant = "default",
      effect = "sparkle",
      effectOptions,
      className = "",
      onClick,
      ...props
    },
    ref,
  ) {
    const blocked =
      props["aria-disabled"] === true || props["aria-disabled"] === "true";
    const sparkle = useButtonSparkle<HTMLAnchorElement>(
      effect === "sparkle",
      blocked,
      effectOptions,
      props,
    );
    return (
      <a
        {...props}
        {...sparkle.events}
        ref={ref}
        data-variant={variant}
        data-effect={effect}
        className={`${styles.button} ${styles.anchor} ${className}`}
        onClick={(event) => {
          if (blocked) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          onClick?.(event);
        }}
      >
        {sparkle.ink}
        <ButtonContent pressTarget={pressTarget}>{children}</ButtonContent>
      </a>
    );
  },
);

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
