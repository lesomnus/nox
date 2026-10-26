import type { ComponentPropsWithRef, CSSProperties } from "react";
import styles from "./section-layout.module.css";

export type SectionLayoutProps = ComponentPropsWithRef<"div"> & {
  /** Bound the column while letting it shrink to the available width. */
  maxWidth?: CSSProperties["maxWidth"];
  align?: "start" | "center";
};
export type SectionGroupProps = ComponentPropsWithRef<"div">;
export type SectionProps = ComponentPropsWithRef<"section">;

/** A bounded column with generous space between independent groups. */
export function SectionLayout({
  maxWidth,
  align = "center",
  className = "",
  style,
  ...props
}: SectionLayoutProps) {
  return (
    <div
      {...props}
      className={`${styles.layout} ${className}`}
      data-section-layout="layout"
      data-align={align}
      style={
        {
          "--section-layout-max-width":
            typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
          ...style,
        } as CSSProperties
      }
    />
  );
}

/** Related sections share small gaps and a rounded outer silhouette. */
export function SectionGroup({ className = "", ...props }: SectionGroupProps) {
  return (
    <div
      {...props}
      className={`${styles.group} ${className}`}
      data-section-layout="group"
    />
  );
}

/** A semantic, borderless surface whose content and accessible name belong to the host. */
export function Section({ className = "", ...props }: SectionProps) {
  return (
    <section
      {...props}
      className={`${styles.section} ${className}`}
      data-section-layout="section"
    />
  );
}
