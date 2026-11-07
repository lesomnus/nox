import type { ReactNode, Ref } from "react";
import styles from "./dialog-surface.module.css";

export const dialogClassName = styles.dialog;
export const dialogAppearanceClassName = styles.appearance;
/** Shared entrance for custom overlay frames; data-enter-effect="fade" preserves geometry. */
export const dialogEntranceClassName = styles.entrance;

// Animate the content, keeping the native dialog's viewport coordinate space
// unchanged for fixed-position menus portaled into its top layer.
export function DialogSurface({
  children,
  anchored = false,
  motion = "default",
  closing = false,
  ref,
}: {
  children: ReactNode;
  anchored?: boolean;
  motion?: "default" | "from-right";
  closing?: boolean;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      className={`${styles.surface} ${styles.appearance} ${styles.entrance}`}
      data-anchored={anchored}
      data-motion={motion}
      data-closing={closing}
    >
      {children}
    </div>
  );
}

/** The same stable-frame, directional blur reveal used by ActionMenu. */
export function DialogReveal({
  children,
  from = "right",
  className,
  contentClassName,
  ...props
}: import("react").HTMLAttributes<HTMLSpanElement> & {
  from?: import("../action-menu/action-menu").MenuMotionDirection;
  contentClassName?: string;
}) {
  return (
    <span
      {...props}
      className={`${styles.entrance} ${className ?? ""}`}
      data-enter-from={`from-${from}`}
      data-enter-effect="reveal-frame"
    >
      <span
        className={`${styles.entrance} ${contentClassName ?? ""}`}
        data-enter-from={`from-${from}`}
        data-enter-effect="reveal"
      >
        {children}
      </span>
    </span>
  );
}
