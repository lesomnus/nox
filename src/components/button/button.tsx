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
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";

type ButtonAppearance = {
  pressTarget?: string;
  /** Brighten this button's own surface with its nearest TableRow state. */
  rowAware?: boolean;
  variant?: "default" | "solid" | "outline" | "toolbar";
  /** Press feedback. Defaults to sparkle; none uses the native variant background. */
  effect?: "sparkle" | "none";
  effectOptions?: ButtonEffectOptions;
};
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonAppearance & {
    /** Decorative surface outside the scaled content layer. */
    decoration?: ReactNode;
    /** Hold the pressed state and sweep a soft highlight over the label. */
    loading?: boolean;
    /** Minimum visible feedback for a Promise-returning click handler, in ms. */
    minLoadingDuration?: number;
    ref?: Ref<HTMLButtonElement>;
  };
export type ButtonAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  ButtonAppearance;

export function Button({
  children,
  decoration,
  pressTarget,
  rowAware = false,
  loading = false,
  minLoadingDuration = 150,
  variant = "default",
  effect = "sparkle",
  effectOptions,
  className = "",
  onClick,
  ...props
}: ButtonProps) {
  const [pending, setPending] = useState(false);
  const running = useRef(false);
  const alive = useRef(true);
  const generation = useRef(0);
  const busy = loading || pending;
  useLayoutEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      running.current = false;
      generation.current++;
    };
  }, []);
  const sparkle = useButtonSparkle<HTMLButtonElement>(
    effect === "sparkle",
    !!(
      busy ||
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
      aria-busy={busy || props["aria-busy"]}
      aria-disabled={busy || props["aria-disabled"]}
      data-loading={busy || undefined}
      data-row-aware={rowAware || undefined}
      data-variant={variant}
      data-effect={effect}
      className={`${styles.button} ${className}`}
      {...sparkle.events}
      onClick={(event) => {
        if (busy || running.current) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        running.current = true;
        const started = performance.now();
        try {
          const result: unknown = onClick?.(event);
          if (
            result &&
            (typeof result === "object" || typeof result === "function") &&
            "then" in result &&
            typeof result.then === "function"
          ) {
            const request = ++generation.current;
            setPending(true);
            // The handler owns failure feedback; release the gate on either
            // outcome without changing the label, focus or submission semantics.
            void Promise.resolve(result).finally(async () => {
              const minimum = Number.isFinite(minLoadingDuration)
                ? Math.max(0, minLoadingDuration)
                : 150;
              const remaining = minimum - (performance.now() - started);
              if (alive.current && remaining > 0)
                await new Promise((resolve) => setTimeout(resolve, remaining));
              if (alive.current && generation.current === request) {
                running.current = false;
                setPending(false);
              }
            });
          } else running.current = false;
        } catch (error) {
          running.current = false;
          throw error;
        }
      }}
    >
      {sparkle.ink}
      {decoration}
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
      rowAware = false,
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
        data-row-aware={rowAware || undefined}
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
