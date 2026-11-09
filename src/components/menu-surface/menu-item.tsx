import { forwardRef, type ComponentProps, type ReactNode } from "react";
import {
  Button,
  ButtonAnchor,
  type ButtonProps,
  type ButtonAnchorProps,
} from "../button/button";
import styles from "./menu-item.module.css";

export type MenuItemProps = ButtonProps & {
  icon?: ReactNode;
  trailing?: ReactNode;
};
export type MenuItemAnchorProps = ButtonAnchorProps & {
  icon?: ReactNode;
  trailing?: ReactNode;
};

/** Native navigation links share the same row, icon and press feedback as actions. */
export const MenuItemAnchor = forwardRef<
  HTMLAnchorElement,
  MenuItemAnchorProps
>(function MenuItemAnchor(
  { icon, trailing, children, className = "", ...props },
  ref,
) {
  return (
    <ButtonAnchor
      {...props}
      ref={ref}
      className={`${styles.item} ${className}`}
    >
      <MenuItemContent icon={icon} trailing={trailing}>
        {children}
      </MenuItemContent>
    </ButtonAnchor>
  );
});

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
      <MenuItemContent icon={icon} trailing={trailing}>
        {children}
      </MenuItemContent>
    </Button>
  );
}

function MenuItemContent({
  icon,
  trailing,
  children,
}: Pick<MenuItemProps, "icon" | "trailing" | "children">) {
  return (
    <>
      <MenuIcon icon={icon} />
      {children}
      {trailing != null && typeof trailing !== "boolean" && (
        <span className={styles.trailing}>{trailing}</span>
      )}
    </>
  );
}

export function MenuItemLabel({
  className = "",
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      {...props}
      data-menu-item-label
      className={`${styles.label} ${className}`}
    />
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
