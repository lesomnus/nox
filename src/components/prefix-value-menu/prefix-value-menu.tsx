import type { ComponentProps, ReactNode } from "react";
import { ValueMenu } from "../value-menu/value-menu";
import styles from "./prefix-value-menu.module.css";

export type PrefixValueMenuProps = ComponentProps<typeof ValueMenu> & {
  /** Inert leading content, such as text or an icon. label names the selector. */
  prefix: ReactNode;
  className?: string;
  prefixClassName?: string;
};

export function PrefixValueMenu({
  prefix,
  className = "",
  prefixClassName = "",
  variant = "compact",
  ...props
}: PrefixValueMenuProps) {
  return (
    <div className={`prefix-value-menu ${styles.field} ${className}`}>
      <span
        className={`${styles.prefix} ${prefixClassName}`}
        aria-hidden="true"
      >
        {prefix}
      </span>
      <ValueMenu {...props} variant={variant} />
    </div>
  );
}
