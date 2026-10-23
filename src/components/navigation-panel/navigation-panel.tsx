import { useId, type ComponentProps, type ReactNode } from "react";
import { ScrollArea, type ScrollAreaProps } from "../scroll-area/scroll-area";
import styles from "./navigation-panel.module.css";

export type NavigationPanelProps = Omit<ComponentProps<"aside">, "title"> & {
  title: ReactNode;
  actions?: ReactNode;
  scrollAreaProps?: Omit<ScrollAreaProps, "children">;
};

export function NavigationPanel({
  title,
  actions,
  children,
  className = "",
  scrollAreaProps,
  ...props
}: NavigationPanelProps) {
  const titleId = useId();
  return (
    <aside
      aria-labelledby={props["aria-label"] ? undefined : titleId}
      {...props}
      className={`${styles.panel} ${className}`}
    >
      <header className={styles.header}>
        <strong id={titleId} className={styles.title}>
          {title}
        </strong>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      <ScrollArea
        {...scrollAreaProps}
        className={`${styles.body} ${scrollAreaProps?.className ?? ""}`}
        contentClassName={`${styles.content} ${scrollAreaProps?.contentClassName ?? ""}`}
      >
        {children}
      </ScrollArea>
    </aside>
  );
}
