import { ScrollArea, type ScrollAreaProps } from "../scroll-area/scroll-area";
import styles from "./menu-scroll-area.module.css";

/** Shared menu viewport, handle, fades and item clearance. */
export function MenuScrollArea({
  className = "",
  viewportClassName = "",
  contentClassName = "",
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollArea
      {...props}
      data-menu-scroll-area=""
      className={`${styles.area} ${className}`}
      viewportClassName={`${styles.viewport} ${viewportClassName}`}
      contentClassName={`${styles.content} ${contentClassName}`}
    />
  );
}
