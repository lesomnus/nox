import type { ComponentProps, ReactNode } from "react";
import { ValueMenu } from "../value-menu/value-menu";
import styles from "./icon-value-menu.module.css";

export function IconValueMenu({
  icon,
  className = "",
  iconClassName = "",
  variant = "compact",
  ...props
}: ComponentProps<typeof ValueMenu> & {
  icon: ReactNode;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div className={`icon-value-menu ${styles.field} ${className}`}>
      <span className={`${styles.icon} ${iconClassName}`} aria-hidden="true">
        {icon}
      </span>
      <ValueMenu {...props} variant={variant} />
    </div>
  );
}
