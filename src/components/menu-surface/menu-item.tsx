import type { ComponentProps, ReactNode } from "react";
import { Button, type ButtonProps } from "../button/button";
import styles from "./menu-item.module.css";

export type MenuItemProps = ButtonProps & {
  icon?: ReactNode;
  trailing?: ReactNode;
};

/** Shared row appearance. The owning menu supplies roles and interaction. */
export function MenuItem({
  icon,
  trailing,
  children,
  className = "",
  ...props
}: MenuItemProps) {
  return (
    <Button {...props} className={`${styles.item} ${className}`}>
      <MenuIcon icon={icon} />
      {children}
      {trailing != null && typeof trailing !== "boolean" && (
        <span className={styles.trailing}>{trailing}</span>
      )}
    </Button>
  );
}

export function MenuIcon({ icon }: { icon?: ReactNode }) {
  return icon ? (
    <span className={styles.icon} aria-hidden="true">
      {icon}
    </span>
  ) : null;
}

export function MenuGroupLabel({
  icon,
  children,
  className = "",
  ...props
}: ComponentProps<"span"> & { icon?: ReactNode }) {
  return (
    <span
      {...props}
      className={`${styles.group} ${className}`}
      data-menu-group-label
    >
      <MenuIcon icon={icon} />
      <span className={styles.groupText}>{children}</span>
    </span>
  );
}

export function MenuDivider({
  className = "",
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={`${styles.divider} ${className}`}
      role="separator"
    />
  );
}
