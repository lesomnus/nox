import { useCallback, useEffect, useRef } from "react";
import { SHAKE_PRESETS, type ShakePreset } from "./shake-presets";

export type ShakeOptions = {
  /** Nominal displacement in CSS pixels, varied independently per target. */
  distance?: number;
  /** Nominal duration in milliseconds, varied independently per target. */
  duration?: number;
  /** Upper bound of the randomized start delay, in milliseconds. */
  maxDelay?: number;
  presets?: readonly ShakePreset[];
};
export type ShakeTargets = Element | Iterable<Element | null> | null;

/** Imperative, wrapper-free motion. The browser interpolates the preset keyframes. */
export function useShake() {
  const animations = useRef(new Set<Animation>());
  const cancel = useCallback(() => {
    for (const animation of animations.current) animation.cancel();
    animations.current.clear();
  }, []);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (preference.matches) cancel();
    };
    preference.addEventListener("change", update);
    return () => {
      preference.removeEventListener("change", update);
      cancel();
    };
  }, [cancel]);
  const shake = useCallback(
    (targets: ShakeTargets, options: ShakeOptions = {}) => {
      cancel();
      if (
        typeof Element === "undefined" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      const elements =
        targets instanceof Element ? [targets] : Array.from(targets ?? []);
      const presets = options.presets?.length ? options.presets : SHAKE_PRESETS;
      const positive = (value: number | undefined, fallback: number) =>
        value !== undefined && Number.isFinite(value)
          ? Math.max(0, value)
          : fallback;
      const distance = positive(options.distance, 3);
      const duration = positive(options.duration, 420);
      if (!distance || !duration) return;
      for (const element of new Set(elements)) {
        if (!element?.isConnected || typeof element.animate !== "function")
          continue;
        const preset = presets[Math.floor(Math.random() * presets.length)];
        const amplitude = distance * (0.75 + Math.random() * 0.5);
        const direction = Math.random() < 0.5 ? -1 : 1;
        const frames = preset.points.map(([x, y], index) => ({
          offset: index / (preset.points.length - 1),
          transform: `translate(${x * amplitude * direction}px, ${y * amplitude}px)`,
        }));
        const animation = element.animate(frames, {
          duration: duration * (0.85 + Math.random() * 0.3),
          delay: Math.random() * positive(options.maxDelay, 45),
          easing: "ease-in-out",
          composite: "add",
        });
        animation.id = `nox-shake:${preset.name}`;
        animations.current.add(animation);
        void animation.finished
          .catch(() => {})
          .finally(() => animations.current.delete(animation));
      }
    },
    [cancel],
  );
  return { shake, cancel };
}
