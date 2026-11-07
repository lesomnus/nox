import { useMemo, useRef } from "react";
import type { TextMotionOptions } from "../components/animated-text/text-motion";

export type ValueMotionOptions = TextMotionOptions & {
  enabled?: boolean;
  /** Start visible values from the viewport's top-left corner. Defaults to true. */
  spatialDelay?: boolean;
  /** Maximum extra start delay in ms after the first changed character. Default 90. */
  characterJitter?: number;
};

// Check every clipping ancestor now, rather than scheduling an entrance on scroll.
function visibleOrigin(element: HTMLElement) {
  if (document.visibilityState !== "visible") return;
  const bounds = element.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  let left = 0,
    top = 0;
  let right = document.documentElement.clientWidth;
  let bottom = document.documentElement.clientHeight;
  for (
    let parent = element.parentElement;
    parent;
    parent = parent.parentElement
  ) {
    const css = getComputedStyle(parent);
    if (css.visibility === "hidden" || css.display === "none") return;
    const clip = parent.getBoundingClientRect();
    if (/auto|scroll|hidden|clip/.test(css.overflowX)) {
      left = Math.max(left, clip.left + parent.clientLeft);
      right = Math.min(
        right,
        clip.left + parent.clientLeft + parent.clientWidth,
      );
    }
    if (/auto|scroll|hidden|clip/.test(css.overflowY)) {
      top = Math.max(top, clip.top + parent.clientTop);
      bottom = Math.min(
        bottom,
        clip.top + parent.clientTop + parent.clientHeight,
      );
    }
  }
  if (
    bounds.right <= left ||
    bounds.left >= right ||
    bounds.bottom <= top ||
    bounds.top >= bottom
  )
    return;
  return Math.round(
    Math.max(0, bounds.top) * 0.7 + Math.max(0, bounds.left) * 0.08,
  );
}

/** Reusable reveal policy; values leaving view cancel, and scroll entry never replays. */
export function useValueMotion({
  enabled = true,
  spatialDelay = true,
  characterJitter = 90,
  motion = "slide",
  animateInitial = true,
  duration = 600,
  maxSlideSteps = 4,
  characterDelay,
  shouldAnimate,
  direction,
  maxFlipSteps,
  flipEasing,
  flipCharacters,
}: ValueMotionOptions = {}): TextMotionOptions {
  const origin = useRef(0);
  const jitter = Number.isFinite(characterJitter)
    ? Math.max(0, Math.floor(characterJitter))
    : 90;
  return useMemo(
    () => ({
      motion: enabled ? motion : "none",
      animateInitial: enabled && animateInitial,
      duration,
      maxSlideSteps,
      direction,
      maxFlipSteps,
      flipEasing,
      flipCharacters,
      shouldAnimate: (element: HTMLElement) => {
        if (!enabled) return false;
        const delay = visibleOrigin(element);
        if (delay === undefined) return false;
        origin.current = spatialDelay ? delay : 0;
        return shouldAnimate?.(element) !== false;
      },
      characterDelay:
        characterDelay ??
        (({ changedIndex }) =>
          origin.current +
          (changedIndex && jitter
            ? 1 + Math.floor(Math.random() * jitter)
            : 0)),
    }),
    [
      enabled,
      spatialDelay,
      jitter,
      motion,
      animateInitial,
      duration,
      maxSlideSteps,
      characterDelay,
      shouldAnimate,
      direction,
      maxFlipSteps,
      flipEasing,
      flipCharacters,
    ],
  );
}
