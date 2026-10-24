import type { ComponentPropsWithRef, CSSProperties } from "react";
import styles from "./skeleton.module.css";

export type SkeletonProps = Omit<ComponentPropsWithRef<"span">, "children"> & {
  variant?: "text" | "rect" | "circle";
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  animated?: boolean;
};

/** Decorative placeholder. Put loading status on the containing region. */
export function Skeleton({
  variant = "text",
  width,
  height,
  animated = true,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={`${styles.skeleton} ${className}`}
      data-variant={variant}
      data-animated={animated || undefined}
      style={{ width, height, ...style }}
    />
  );
}
