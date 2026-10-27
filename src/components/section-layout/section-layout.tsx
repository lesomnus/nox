import type { ComponentPropsWithRef, CSSProperties } from "react";
import { Button, type ButtonProps } from "../button/button";
import styles from "./section-layout.module.css";

export type SectionLayoutProps = ComponentPropsWithRef<"div"> & {
  /** Bound the column while letting it shrink to the available width. */
  maxWidth?: CSSProperties["maxWidth"];
  align?: "start" | "center";
};
export type SectionGroupProps = ComponentPropsWithRef<"div">;
export type SectionSurfaceProps = ComponentPropsWithRef<"section"> & {
  as?: "section";
};
export type SectionButtonProps = Omit<ButtonProps, "variant"> & {
  as: "button";
};
export type SectionProps = SectionSurfaceProps | SectionButtonProps;

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
export function Section(props: SectionProps) {
  if (props.as === "button") {
    const { as, className = "", type = "button", ...button } = props;
    return (
      <Button
        {...button}
        type={type}
        className={`${styles.section} ${styles.action} ${className}`}
        data-section-layout="section"
        data-section-action={as}
      />
    );
  }
  const { as: Element = "section", className = "", ...surface } = props;
  return (
    <Element
      {...surface}
      className={`${styles.section} ${className}`}
      data-section-layout="section"
    />
  );
}
