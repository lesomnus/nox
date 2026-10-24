import type { ReactNode } from "react";
import {
  PrefixValueMenu,
  type PrefixValueMenuProps,
} from "../prefix-value-menu/prefix-value-menu";

/** @deprecated Use PrefixValueMenuProps with prefix and prefixClassName. */
export type IconValueMenuProps = Omit<
  PrefixValueMenuProps,
  "prefix" | "prefixClassName"
> & {
  icon: ReactNode;
  iconClassName?: string;
};

/** @deprecated Use PrefixValueMenu with prefix and prefixClassName. */
export function IconValueMenu({
  icon,
  className = "",
  iconClassName = "",
  ...props
}: IconValueMenuProps) {
  return (
    <PrefixValueMenu
      {...props}
      prefix={icon}
      prefixClassName={iconClassName}
      className={`icon-value-menu ${className}`}
    />
  );
}
