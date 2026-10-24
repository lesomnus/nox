import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { FloatingCard } from "../floating-card/floating-card";
import styles from "./card.module.css";

export type CardProps = ComponentProps<typeof FloatingCard> & {
  /** Fill a bounded parent and let a composed ScrollArea consume the body. */
  fill?: boolean;
  /** Body padding only. Numbers are pixels; CSS padding values are supported. */
  bodyPadding?: CSSProperties["padding"];
};

/** Shared heading, inset body and footer; placement and modal behavior belong to the host. */
export function Card({
  fill = false,
  bodyPadding,
  className = "",
  style,
  ...props
}: CardProps) {
  return (
    <FloatingCard
      data-entered="true"
      {...props}
      data-fill={fill || undefined}
      className={`${styles.card} ${className}`}
      style={
        {
          "--card-body-padding":
            typeof bodyPadding === "number" ? `${bodyPadding}px` : bodyPadding,
          ...style,
        } as CSSProperties
      }
    />
  );
}

export function CardActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}
