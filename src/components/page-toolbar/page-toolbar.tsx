import type { ComponentProps, ReactNode } from "react";
import styles from "./page-toolbar.module.css";

export function PageToolbar({
  children,
  actions,
  className = "",
  ...props
}: ComponentProps<"header"> & { actions?: ReactNode }) {
  return (
    <header {...props} className={`${styles.toolbar} ${className}`}>
      <div className={styles.content}>{children}</div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
