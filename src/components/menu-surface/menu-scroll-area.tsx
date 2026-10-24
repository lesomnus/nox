import { ScrollArea, type ScrollAreaProps } from "../scroll-area/scroll-area";
import styles from "./menu-scroll-area.module.css";

/** Shared menu viewport, handle, fades and item clearance. */
export function MenuScrollArea({
  className = "",
  viewportClassName = "",
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollArea
      {...props}
      className={`${styles.area} ${className}`}
      viewportClassName={`${styles.viewport} ${viewportClassName}`}
    />
  );
}
