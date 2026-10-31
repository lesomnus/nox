import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithRef,
} from "react";
import { createPortal } from "react-dom";
import styles from "./menu-surface.module.css";

export type MenuSurfaceProps = ComponentPropsWithRef<"div"> & {
  /** Trigger whose typography, button corners and nearest open dialog the popup should use. */
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
    const node = surface.current;
    const sync = () => {
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
          node.style[property] = typography[property];
      }
      if (style?.borderRadius !== undefined) {
        node.style.setProperty(
          "--menu-surface-radius",
          typeof style.borderRadius === "number"
            ? `${style.borderRadius}px`
            : style.borderRadius,
        );
      } else if (
        anchor.matches('button, a[href], [role="button"], [role="combobox"]')
      ) {
        const frame = getComputedStyle(node);
        const inset = (side: "Top" | "Right" | "Bottom" | "Left") =>
          parseFloat(frame[`padding${side}`]) +
          parseFloat(frame[`border${side}Width`]);
        const corners = [
          ["TopLeft", "Left", "Top"],
          ["TopRight", "Right", "Top"],
          ["BottomRight", "Right", "Bottom"],
          ["BottomLeft", "Left", "Bottom"],
        ] as const;
        const radii = corners.map(([corner, horizontal, vertical]) => {
          const [x, y = x] = typography[`border${corner}Radius`].split(" ");
          return [
            `calc(${x} + ${inset(horizontal)}px)`,
            `calc(${y} + ${inset(vertical)}px)`,
          ];
        });
        // Concentric corners: the outer curve includes the popup's frame inset.
        node.style.setProperty(
          "--menu-surface-radius",
          `${radii.map(([x]) => x).join(" ")} / ${radii.map(([, y]) => y).join(" ")}`,
        );
      }
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(anchor);
    observer.observe(node);
    return () => observer.disconnect();
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
