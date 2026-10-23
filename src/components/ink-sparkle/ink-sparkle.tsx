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
  /** Called once after a single burst. Reduced motion completes immediately. */
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
  onComplete,
}: InkSparkleProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const completeRef = useRef(onComplete);
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
    let cycleSeed = seed ?? Math.random() * 1000;
    const stop = () => cancelAnimationFrame(request);
    const draw = (now: number) => {
      if (!renderer) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width <= 0 || height <= 0) return;
      const elapsed = Math.max(0, now - start);
      const playback = inkSparklePlayback(elapsed, duration, loop);
      if (playback.cycle !== cycle) {
        cycle = playback.cycle;
        cycleSeed = seed ?? Math.random() * 1000;
      }
      renderer.draw(
        media.matches ? 0.3 : playback.progress,
        cycleSeed,
        width,
        height,
        window.devicePixelRatio || 1,
        [originX ?? width / 2, originY ?? height / 2],
        [red, green, blue, alpha],
        centerMotion,
      );
      if (!completed && (playback.complete || (media.matches && !loop))) {
        completed = true;
        completeRef.current?.();
      }
    };
    const tick = (now: number) => {
      draw(now);
      if (!completed) request = requestAnimationFrame(tick);
    };
    const resume = () => {
      stop();
      if (!renderer || document.hidden) return;
      if (completed) return;
      start = performance.now();
      draw(start);
      if (!media.matches && !completed) request = requestAnimationFrame(tick);
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
    return () => {
      stop();
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
  return (
    <canvas
      ref={ref}
      className={`${styles.canvas} ${className ?? ""}`}
      style={style}
      aria-hidden="true"
      data-ink-sparkle=""
    />
  );
}
