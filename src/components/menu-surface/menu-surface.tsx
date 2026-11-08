import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithRef,
} from "react";
import { createPortal } from "react-dom";
import styles from "./menu-surface.module.css";

export function menuPixelSize(node: HTMLElement) {
  return 1 / ((window.devicePixelRatio || 1) * (node.currentCSSZoom || 1));
}

/** Snap a freely positioned frame without reading its entrance transform. */
export function snapMenuPosition(node: HTMLElement) {
  const pixel = menuPixelSize(node);
  const css = getComputedStyle(node);
  const left = parseFloat(css.left);
  const top = parseFloat(css.top);
  if (Number.isFinite(left)) {
    const shift = Math.round(left / pixel) * pixel - left;
    if (node.style.right && node.style.right !== "auto")
      node.style.right = `${parseFloat(css.right) - shift}px`;
    else node.style.left = `${left + shift}px`;
  }
  if (Number.isFinite(top)) {
    const shift = Math.round(top / pixel) * pixel - top;
    if (node.style.bottom && node.style.bottom !== "auto")
      node.style.bottom = `${parseFloat(css.bottom) - shift}px`;
    else node.style.top = `${top + shift}px`;
  }
}

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
      const pixel = menuPixelSize(node);
      node.style.setProperty("--menu-pixel-size", `${pixel}px`);
      const frame = getComputedStyle(node);
      const border = parseFloat(frame.borderTopWidth);
      const roundedBorder = Math.round(border / pixel) * pixel;
      // Computed CSS serializes fractional borders with limited precision.
      // Restore whole-pixel borders before subtracting them from the inset.
      node.style.setProperty(
        "--menu-frame-border-width",
        `${Math.abs(roundedBorder - border) < 0.00001 ? roundedBorder : border}px`,
      );
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
      const corners = [
        ["TopLeft", "Left", "Top"],
        ["TopRight", "Right", "Top"],
        ["BottomRight", "Right", "Bottom"],
        ["BottomLeft", "Left", "Bottom"],
      ] as const;
      const inset = (side: "Top" | "Right" | "Bottom" | "Left") =>
        parseFloat(frame[`padding${side}`]) +
        parseFloat(frame[`border${side}Width`]);
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
      // Read the final surface shape, including explicit overrides. Every row
      // and the scrolling clip use its inset curve, rather than Button's radius.
      const radii = corners.map(([corner, horizontal, vertical]) => {
        const [x, y = x] = frame[`border${corner}Radius`].split(" ");
        const inner = [
          `max(0px, calc(${x} - ${inset(horizontal)}px))`,
          `max(0px, calc(${y} - ${inset(vertical)}px))`,
        ];
        const name = corner.replace(
          /[A-Z]/g,
          (letter) => `-${letter.toLowerCase()}`,
        );
        node.style.setProperty(`--menu-inner${name}-radius`, inner.join(" "));
        return inner;
      });
      node.style.setProperty(
        "--menu-inner-radius",
        `${radii.map(([x]) => x).join(" ")} / ${radii.map(([, y]) => y).join(" ")}`,
      );
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(anchor);
    observer.observe(node);
    let resolution: MediaQueryList;
    const watchResolution = () => {
      resolution?.removeEventListener("change", updateResolution);
      resolution = window.matchMedia(
        `(resolution: ${window.devicePixelRatio}dppx)`,
      );
      resolution.addEventListener("change", updateResolution);
    };
    const updateResolution = () => {
      sync();
      watchResolution();
    };
    watchResolution();
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      resolution.removeEventListener("change", updateResolution);
      window.removeEventListener("resize", sync);
    };
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
