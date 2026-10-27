import type { ComponentPropsWithRef, ReactNode } from "react";
import styles from "./menu-frame.module.css";

export type MenuFrameProps = ComponentPropsWithRef<"div"> & {
  header?: ReactNode;
  footer?: ReactNode;
  bodyProps?: ComponentPropsWithRef<"div">;
};

/** Fixed regions surround the body; compose a MenuScrollArea inside the body. */
export function MenuFrame({
  header,
  footer,
  bodyProps,
  children,
  className = "",
  ...props
}: MenuFrameProps) {
  return (
    <div
      {...props}
      data-menu-frame=""
      className={`${styles.frame} ${className}`}
    >
      {hasMenuRegion(header) && (
        <div className={styles.fixed} data-menu-fixed="header">
          {header}
        </div>
      )}
      <div
        {...bodyProps}
        data-menu-body=""
        className={`${styles.body} ${bodyProps?.className ?? ""}`}
      >
        {children}
      </div>
      {hasMenuRegion(footer) && (
        <div className={styles.fixed} data-menu-fixed="footer">
          {footer}
        </div>
      )}
    </div>
  );
}

// Only this surface's regions count; nested menus are portaled separately.
export function menuFixedHeight(surface: HTMLElement) {
  return [...surface.querySelectorAll<HTMLElement>("[data-menu-fixed]")].reduce(
    (height, region) => height + region.offsetHeight,
    0,
  );
}

export function hasMenuRegion(content: ReactNode) {
  return content != null && typeof content !== "boolean";
}
