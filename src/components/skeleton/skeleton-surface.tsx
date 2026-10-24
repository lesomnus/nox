import { useLayoutEffect, useRef, useState } from "react";
import { InkSparkle, type InkSparkleProps } from "../ink-sparkle/ink-sparkle";
import styles from "./skeleton.module.css";

export type SkeletonSparkleOptions = Pick<
  InkSparkleProps,
  "color" | "sparkleColor" | "duration" | "seed" | "origin"
>;

export function createSkeletonRegistry() {
  const nodes = new Set<HTMLElement>();
  const listeners = new Set<() => void>();
  return {
    nodes,
    register(node: HTMLElement) {
      nodes.add(node);
      listeners.forEach((listener) => listener());
      return () => {
        nodes.delete(node);
        listeners.forEach((listener) => listener());
      };
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
export type SkeletonRegistry = ReturnType<typeof createSkeletonRegistry>;

// SVG masks preserve all four CSS corner radii, including elliptical/percentage
// radii and the CSS rule that scales overlapping corners to fit the box.
function roundedBox(
  x: number,
  y: number,
  width: number,
  height: number,
  style: CSSStyleDeclaration,
) {
  const corners = [
    style.borderTopLeftRadius,
    style.borderTopRightRadius,
    style.borderBottomRightRadius,
    style.borderBottomLeftRadius,
  ].map((value) => {
    const [a, b = a] = value.split(/\s+/);
    const length = (part: string, size: number) =>
      part.endsWith("%")
        ? (parseFloat(part) * size) / 100
        : parseFloat(part) || 0;
    return [length(a, width), length(b, height)];
  });
  const [tl, tr, br, bl] = corners;
  const ratio = Math.min(
    1,
    width / (tl[0] + tr[0] || 1),
    width / (bl[0] + br[0] || 1),
    height / (tl[1] + bl[1] || 1),
    height / (tr[1] + br[1] || 1),
  );
  for (const corner of corners) {
    corner[0] *= ratio;
    corner[1] *= ratio;
  }
  return `M${x + tl[0]} ${y}H${x + width - tr[0]}A${tr[0]} ${tr[1]} 0 0 1 ${x + width} ${y + tr[1]}V${y + height - br[1]}A${br[0]} ${br[1]} 0 0 1 ${x + width - br[0]} ${y + height}H${x + bl[0]}A${bl[0]} ${bl[1]} 0 0 1 ${x} ${y + height - bl[1]}V${y + tl[1]}A${tl[0]} ${tl[1]} 0 0 1 ${x + tl[0]} ${y}Z`;
}

function maskFor(nodes: Iterable<HTMLElement>, surface: HTMLElement) {
  const bounds = surface.getBoundingClientRect();
  const width = surface.clientWidth,
    height = surface.clientHeight;
  const scaleX = width / bounds.width,
    scaleY = height / bounds.height;
  const shapes: string[] = [];
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    if (
      !rect.width ||
      !rect.height ||
      style.visibility === "hidden" ||
      style.display === "none"
    )
      continue;
    // Respect rectangular overflow clips between a skeleton and its group.
    let left = bounds.left,
      top = bounds.top,
      right = bounds.right,
      bottom = bounds.bottom;
    for (
      let parent = node.parentElement;
      parent && parent !== surface.parentElement;
      parent = parent.parentElement
    ) {
      const parentStyle = getComputedStyle(parent);
      const box = parent.getBoundingClientRect();
      const sx = box.width / (parent.offsetWidth || box.width || 1);
      const sy = box.height / (parent.offsetHeight || box.height || 1);
      if (parentStyle.overflowX !== "visible") {
        left = Math.max(left, box.left + parent.clientLeft * sx);
        right = Math.min(
          right,
          box.left + (parent.clientLeft + parent.clientWidth) * sx,
        );
      }
      if (parentStyle.overflowY !== "visible") {
        top = Math.max(top, box.top + parent.clientTop * sy);
        bottom = Math.min(
          bottom,
          box.top + (parent.clientTop + parent.clientHeight) * sy,
        );
      }
    }
    if (right <= left || bottom <= top) continue;
    const index = shapes.length;
    const d = roundedBox(
      (rect.left - bounds.left) * scaleX,
      (rect.top - bounds.top) * scaleY,
      rect.width * scaleX,
      rect.height * scaleY,
      style,
    );
    shapes.push(
      `<defs><clipPath id="clip${index}"><rect x="${(left - bounds.left) * scaleX}" y="${(top - bounds.top) * scaleY}" width="${(right - left) * scaleX}" height="${(bottom - top) * scaleY}"/></clipPath></defs><path d="${d}" fill="white" clip-path="url(#clip${index})"/>`,
    );
  }
  if (!shapes.length) return "";
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapes.join("")}</svg>`)}")`;
}

function palette(node: HTMLElement) {
  const style = getComputedStyle(node);
  const context = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  const read = (
    token: string,
    fallback: string,
  ): NonNullable<InkSparkleProps["color"]> => {
    if (!context) return [1, 1, 1, 0.1];
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = style.getPropertyValue(token).trim() || fallback;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255, a / 255];
  };
  const duration = style.getPropertyValue("--ui-skeleton-duration").trim();
  return {
    color: read("--ui-skeleton-ink-color", "rgba(255,255,255,0.08)"),
    sparkleColor: read("--ui-skeleton-highlight", "rgba(255,255,255,0.35)"),
    duration:
      (parseFloat(duration) || 1600) *
      (duration.endsWith("ms") || !duration.endsWith("s") ? 1 : 1000),
  };
}

/** One canvas and animation clock, clipped to the registered shapes. */
export function SkeletonSurface({
  registry,
  sparkleOptions,
}: {
  registry?: SkeletonRegistry;
  sparkleOptions?: SkeletonSparkleOptions;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [view, setView] = useState<
    | ({ width: number; height: number; mask: string } & ReturnType<
        typeof palette
      >)
    | null
  >(null);
  useLayoutEffect(() => {
    const surface = ref.current!;
    const host = surface.parentElement!;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      const width = surface.clientWidth,
        height = surface.clientHeight;
      const next = {
        width,
        height,
        mask:
          registry && width && height ? maskFor(registry.nodes, surface) : "",
        ...palette(host),
      };
      setView((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(surface);
    const observed = new Set<HTMLElement>();
    const sync = () => {
      const nodes = registry?.nodes ?? new Set([host]);
      for (const node of observed)
        if (!nodes.has(node)) {
          observer.unobserve(node);
          observed.delete(node);
        }
      for (const node of nodes)
        if (!observed.has(node)) {
          observer.observe(node);
          observed.add(node);
        }
      schedule();
    };
    const unsubscribe = registry?.subscribe(sync);
    sync();
    const mutations = new MutationObserver((records) => {
      if (records.some((record) => !surface.contains(record.target)))
        schedule();
    });
    mutations.observe(host, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["style", "class", "hidden"],
    });
    for (
      let parent = host.parentElement;
      parent;
      parent = parent.parentElement
    ) {
      mutations.observe(parent, {
        attributes: true,
        attributeFilter: ["style", "class", "data-ui-theme", "data-theme"],
      });
    }
    host.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      unsubscribe?.();
      host.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [registry]);
  return (
    <span
      ref={ref}
      className={styles.surface}
      aria-hidden="true"
      data-skeleton="effect"
      style={
        registry
          ? {
              maskImage:
                view?.mask || "linear-gradient(transparent, transparent)",
            }
          : undefined
      }
    >
      {view &&
        view.width > 0 &&
        view.height > 0 &&
        (!registry || view.mask) && (
          <InkSparkle
            color={view.color}
            sparkleColor={view.sparkleColor}
            duration={view.duration}
            {...sparkleOptions}
            origin={
              sparkleOptions?.origin ??
              (registry
                ? [
                    -0.1 * Math.min(view.width, view.height),
                    -0.1 * Math.min(view.width, view.height),
                  ]
                : [
                    -Math.min(2 * view.height, view.width * 0.1),
                    view.height / 2,
                  ])
            }
            centerMotion="fixed"
            loop
          />
        )}
    </span>
  );
}
