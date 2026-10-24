import type { ComponentPropsWithRef, ReactNode } from "react";
import styles from "./link-button.module.css";

export type LinkButtonProps = ComponentPropsWithRef<"a"> & {
  /** Trailing decoration; pass null to hide the default arrow. */
  trailing?: ReactNode;
};

export function LinkButton({
  children,
  trailing = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  ),
  className = "",
  ...props
}: LinkButtonProps) {
  return (
    <a {...props} className={`${styles.link} ${className}`}>
      <span className={styles.label}>{children}</span>
      {trailing != null && (
        <span className={styles.trailing} aria-hidden="true">
          {trailing}
        </span>
      )}
    </a>
  );
}
