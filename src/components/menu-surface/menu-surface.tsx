import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithRef,
} from "react";
import { createPortal } from "react-dom";
import styles from "./menu-surface.module.css";

export type MenuSurfaceProps = ComponentPropsWithRef<"div"> & {
  /** Trigger whose typography and nearest open dialog the popup should use. */
  anchor: HTMLElement | null | undefined;
};

/** Portaled menu appearance; callers own placement, roles and interaction. */
export function MenuSurface({
  anchor,
  ref,
  className = "",
  style,
  ...props
}: MenuSurfaceProps) {
  const surface = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => surface.current!, []);
  useLayoutEffect(() => {
    if (!anchor || !surface.current) return;
    const typography = getComputedStyle(anchor);
    for (const property of [
      "fontFamily",
      "fontSize",
      "fontWeight",
      "fontStyle",
      "fontVariant",
      "fontFeatureSettings",
      "fontVariationSettings",
      "letterSpacing",
      "lineHeight",
    ] as const) {
      if (style?.[property] === undefined)
        surface.current.style[property] = typography[property];
    }
  });
  const target =
    anchor?.closest("dialog[open]") ??
    (typeof document === "undefined" ? null : document.body);
  return (
    target &&
    createPortal(
      <div
        {...props}
        ref={surface}
        className={`${styles.surface} ${className}`}
        style={style}
      />,
      target,
    )
  );
}

export { MenuFrame, type MenuFrameProps } from "./menu-frame";
