import { useEffect, useRef, type CSSProperties } from "react";
import {
  inkSparkleDuration,
  inkSparklePlayback,
  type InkSparkleCenterMotion,
} from "./ink-sparkle-model";
import { createInkSparkleRenderer } from "./ink-sparkle-renderer";
import styles from "./ink-sparkle.module.css";

export type { InkSparkleCenterMotion } from "./ink-sparkle-model";
const releaseDuration = 180;

export interface InkSparkleProps {
  className?: string;
  /** Normalized RGBA channels, each from 0 to 1. Sparkles remain white. */
  color?: readonly [number, number, number, number];
  /** Center in local CSS pixels; negative/off-surface coordinates are supported. */
  origin?: readonly [number, number];
  /** Milliseconds per burst. Defaults to Flutter's original 617ms. */
  duration?: number;
  /** Original contact-to-center motion, or expansion around a fixed origin. */
  centerMotion?: InkSparkleCenterMotion;
  /** Repeat until unmounted. Defaults to a single burst. */
  loop?: boolean;
  /** Hold expanded ink while true; false fades it out. Omit for one-shot/loop playback. */
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
    let releaseTimer: ReturnType<typeof setTimeout> | undefined;
    let cycleSeed = seed ?? Math.random() * 1000;
    const stop = () => cancelAnimationFrame(request);
    const draw = (now: number) => {
      if (!renderer || pressedRef.current === false) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width <= 0 || height <= 0) return;
      const elapsed = Math.max(0, now - start);
      const holding = pressedRef.current === true;
      const playback = inkSparklePlayback(elapsed, duration, !holding && loop);
      const progress = holding
        ? Math.min(0.4, playback.progress)
        : playback.progress;
      resting = holding && progress >= 0.4;
      if (playback.cycle !== cycle) {
        cycle = playback.cycle;
        cycleSeed = seed ?? Math.random() * 1000;
      }
      renderer.draw(
        media.matches ? 0.3 : progress,
        cycleSeed,
        width,
        height,
        window.devicePixelRatio || 1,
        [originX ?? width / 2, originY ?? height / 2],
        [red, green, blue, alpha],
        centerMotion,
      );
      if (
        !holding &&
        !completed &&
        (playback.complete || (media.matches && !loop))
      ) {
        completed = true;
        completeRef.current?.();
      }
    };
    const tick = (now: number) => {
      draw(now);
      if (!completed && !resting && pressedRef.current !== false)
        request = requestAnimationFrame(tick);
    };
    const resume = () => {
      stop();
      if (!renderer || document.hidden || pressedRef.current === false) return;
      if (completed) return;
      start = performance.now();
      draw(start);
      if (!media.matches && !completed && !resting)
        request = requestAnimationFrame(tick);
    };
    pressChange.current = () => {
      clearTimeout(releaseTimer);
      if (pressedRef.current === false) {
        stop();
        const finish = () => {
          if (completed) return;
          completed = true;
          completeRef.current?.();
        };
        if (media.matches || !renderer) finish();
        else releaseTimer = setTimeout(finish, releaseDuration);
      } else {
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
        if (!loop && !completed) {
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
      clearTimeout(releaseTimer);
      pressChange.current = undefined;
      observer.disconnect();
      media.removeEventListener("change", resume);
      document.removeEventListener("visibilitychange", resume);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", initialize);
      renderer?.dispose();
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
      style={
        pressed === undefined
          ? style
          : ({
              ...style,
              "--ink-sparkle-release-duration": `${releaseDuration}ms`,
            } as CSSProperties)
      }
      aria-hidden="true"
      data-ink-sparkle=""
      data-pressed={pressed}
    />
  );
}
