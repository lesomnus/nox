import { forwardRef, type ComponentProps } from "react";
import { Button, ButtonAnchor, type ButtonAnchorProps } from "../button/button";
import styles from "./panel-item.module.css";

// Selection follows the native accessibility state for both buttons and links.
export function PanelItem({
  className = "",
  ...props
}: ComponentProps<typeof Button>) {
  return <Button {...props} className={`${styles.item} ${className}`} />;
}

export const PanelItemAnchor = forwardRef<HTMLAnchorElement, ButtonAnchorProps>(
  function PanelItemAnchor(
    { children, pressTarget, className = "", ...props },
    ref,
  ) {
    return (
      <ButtonAnchor
        {...props}
        ref={ref}
        pressTarget={pressTarget}
        className={`${styles.item} route-link ${className}`}
      >
        {children}
      </ButtonAnchor>
    );
  },
);
