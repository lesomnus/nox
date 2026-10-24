import { useEffect, useRef, type CSSProperties } from "react";
import {
  inkSparkleDuration,
  inkSparklePlayback,
  type InkSparkleCenterMotion,
} from "./ink-sparkle-model";
import { createInkSparkleRenderer } from "./ink-sparkle-renderer";
import styles from "./ink-sparkle.module.css";

export type { InkSparkleCenterMotion } from "./ink-sparkle-model";

export interface InkSparkleProps {
  className?: string;
  /** Normalized RGBA ink channels, each from 0 to 1. */
  color?: readonly [number, number, number, number];
  /** Independent normalized RGBA sparkle tint; alpha controls strength. Defaults to opaque white. */
  sparkleColor?: readonly [number, number, number, number];
  /** Center in local CSS pixels; negative/off-surface coordinates are supported. */
  origin?: readonly [number, number];
  /** Milliseconds per burst. Defaults to Flutter's original 617ms. */
  duration?: number;
  /** Original contact-to-center motion, or expansion around a fixed origin. */
  centerMotion?: InkSparkleCenterMotion;
  /** Repeat until unmounted. Defaults to a single burst. */
  loop?: boolean;
  /** Hold expanded ink while true; false plays the remaining animation to completion. */
  pressed?: boolean;
  /** Called once after a single burst or release. Reduced motion completes immediately. */
  onComplete?: () => void;
  seed?: number;
  style?: CSSProperties;
}

/** Flutter InkSparkle, with its original shader and animation, in a web canvas. */
export function InkSparkle({
  className,
  color = [1, 1, 1, 0.24],
  sparkleColor = [1, 1, 1, 1],
  origin,
  seed,
  style,
  duration = inkSparkleDuration,
  centerMotion = "to-center",
  loop = false,
  pressed,
  onComplete,
}: InkSparkleProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const completeRef = useRef(onComplete);
  const pressedRef = useRef(pressed);
  const pressChange = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);
  const [red, green, blue, alpha] = color;
  const [sparkleRed, sparkleGreen, sparkleBlue, sparkleAlpha] = sparkleColor;
  const originX = origin?.[0];
  const originY = origin?.[1];
  useEffect(() => {
    const canvas = ref.current!;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let renderer: ReturnType<typeof createInkSparkleRenderer> | undefined;
    let request = 0;
    let start = performance.now();
    let cycle = -1;
    let completed = false;
    let resting = false;
    let started = pressedRef.current !== false;
    let playhead = 0;
    let offset = 0;
    const lifetime =
      Number.isFinite(duration) && duration > 0 ? duration : inkSparkleDuration;
    let cycleSeed = seed ?? Math.random() * 1000;
    const stop = () => cancelAnimationFrame(request);
    const draw = (now: number, finish = false) => {
      if (!renderer || !started) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width <= 0 || height <= 0) return;
      const elapsed = Math.max(0, now - start) + offset;
      const holding = pressedRef.current === true;
      const looping = pressedRef.current === undefined && loop;
      const playback = inkSparklePlayback(elapsed, duration, looping);
      const progress = finish
        ? 1
        : media.matches
          ? 0.3
          : holding
            ? Math.min(0.4, playback.progress)
            : playback.progress;
      playhead = progress;
      resting = holding && progress >= 0.4;
      if (playback.cycle !== cycle) {
        cycle = playback.cycle;
        cycleSeed = seed ?? Math.random() * 1000;
      }
      renderer.draw(
        progress,
        cycleSeed,
        width,
        height,
        window.devicePixelRatio || 1,
        [originX ?? width / 2, originY ?? height / 2],
        [red, green, blue, alpha],
        centerMotion,
        [sparkleRed, sparkleGreen, sparkleBlue, sparkleAlpha],
      );
      if (
        !holding &&
        !completed &&
        (playback.complete || (media.matches && !looping))
      ) {
        completed = true;
        completeRef.current?.();
      }
    };
    const tick = (now: number) => {
      draw(now);
      if (!completed && !resting) request = requestAnimationFrame(tick);
    };
    const resume = () => {
      stop();
      if (!renderer || document.hidden || !started) return;
      if (completed) return;
      if (pressedRef.current !== undefined) offset = playhead * lifetime;
      start = performance.now();
      draw(start, media.matches && pressedRef.current === false);
      if (!media.matches && !completed && !resting)
        request = requestAnimationFrame(tick);
    };
    pressChange.current = () => {
      if (pressedRef.current === false) {
        if (!started) {
          if (completed) return;
          completed = true;
          completeRef.current?.();
        } else resume();
      } else {
        started = true;
        playhead = offset = 0;
        completed = false;
        resume();
      }
    };
    const initialize = () => {
      try {
        renderer = createInkSparkleRenderer(canvas);
        canvas.dataset.renderer = "webgl2";
        delete canvas.dataset.error;
        resume();
      } catch (error) {
        canvas.dataset.renderer = "unavailable";
        canvas.dataset.error = String(error);
        if ((!loop || pressedRef.current !== undefined) && !completed) {
          completed = true;
          completeRef.current?.();
        }
      }
    };
    const lost = (event: Event) => {
      event.preventDefault();
      stop();
      renderer = undefined;
      canvas.dataset.renderer = "unavailable";
    };
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", initialize);
    document.addEventListener("visibilitychange", resume);
    media.addEventListener("change", resume);
    const observer = new ResizeObserver(() => draw(performance.now()));
    observer.observe(canvas);
    initialize();
    if (pressedRef.current === false) pressChange.current?.();
    return () => {
      stop();
      pressChange.current = undefined;
      observer.disconnect();
      media.removeEventListener("change", resume);
      document.removeEventListener("visibilitychange", resume);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", initialize);
      renderer?.dispose();
      // Prop changes and StrictMode reuse the mounted canvas. Lose the context
      // only after removal; an intentionally lost context cannot be recreated
      // synchronously by the next effect setup.
      if (!canvas.isConnected)
        canvas
          .getContext("webgl2")
          ?.getExtension("WEBGL_lose_context")
          ?.loseContext();
    };
  }, [
    red,
    green,
    blue,
    alpha,
    sparkleRed,
    sparkleGreen,
    sparkleBlue,
    sparkleAlpha,
    originX,
    originY,
    seed,
    duration,
    centerMotion,
    loop,
  ]);
  useEffect(() => {
    if (pressedRef.current === pressed) return;
    pressedRef.current = pressed;
    pressChange.current?.();
  }, [pressed]);
  return (
    <canvas
      ref={ref}
      className={`${styles.canvas} ${className ?? ""}`}
      style={style}
      aria-hidden="true"
      data-ink-sparkle=""
      data-pressed={pressed}
    />
  );
}
