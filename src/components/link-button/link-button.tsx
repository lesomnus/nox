import type { ComponentPropsWithRef, ReactNode } from "react";
import { ButtonAnchor, type ButtonAnchorProps } from "../button/button";
import styles from "./link-button.module.css";

type LinkProps = ComponentPropsWithRef<"a"> & {
  /** Trailing decoration; pass null to hide the default arrow. */
  trailing?: ReactNode;
};

export type TableLinkButtonProps = LinkProps &
  Pick<
    ButtonAnchorProps,
    "rowAware" | "effect" | "effectOptions" | "pressTarget"
  > & {
    variant: "table";
    leading?: ReactNode;
    detail?: ReactNode;
    /** Mute the surface without disabling navigation. */
    inactive?: boolean;
  };

export type LinkButtonProps =
  | (LinkProps & { variant?: "inline" })
  | TableLinkButtonProps;

const arrow = (
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
);

export function LinkButton(props: LinkButtonProps) {
  const trailing = props.trailing === undefined ? arrow : props.trailing;
  const decoration = trailing != null && (
    <span className={styles.trailing} aria-hidden="true">
      {trailing}
    </span>
  );
  if (props.variant === "table") {
    const {
      variant,
      trailing,
      leading,
      detail,
      inactive,
      rowAware = true,
      children,
      className = "",
      ...anchor
    } = props;
    return (
      <ButtonAnchor
        {...anchor}
        rowAware={rowAware}
        className={`${styles.tableLink} ${className}`}
        data-inactive={inactive || undefined}
      >
        {leading}
        <span className={styles.identity}>
          <span className={styles.title}>{children}</span>
          {detail != null && <span className={styles.detail}>{detail}</span>}
        </span>
        {decoration}
      </ButtonAnchor>
    );
  }
  const {
    variant,
    trailing: _trailing,
    children,
    className = "",
    ...anchor
  } = props;
  return (
    <a {...anchor} className={`${styles.link} ${className}`}>
      <span className={styles.label}>{children}</span>
      {decoration}
    </a>
  );
}
