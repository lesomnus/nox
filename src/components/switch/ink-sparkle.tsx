import { useEffect, useRef, type CSSProperties } from "react";
import { inkSparkleDuration } from "./ink-sparkle-model";
import { createInkSparkleRenderer } from "./ink-sparkle-renderer";

/** Flutter InkSparkle, with its original shader and animation, in a web canvas. */
export function InkSparkle({
  className,
  color,
  origin,
  seed,
  style,
}: {
  className?: string;
  color: readonly [number, number, number, number];
  origin?: readonly [number, number];
  seed?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
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
    let cycleSeed = seed ?? Math.random() * 1000;
    const stop = () => cancelAnimationFrame(request);
    const draw = (now: number) => {
      if (!renderer) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width <= 0 || height <= 0) return;
      const elapsed = Math.max(0, now - start);
      const nextCycle = Math.floor(elapsed / inkSparkleDuration);
      if (nextCycle !== cycle) {
        cycle = nextCycle;
        cycleSeed = seed ?? Math.random() * 1000;
      }
      renderer.draw(
        media.matches
          ? 0.3
          : (elapsed % inkSparkleDuration) / inkSparkleDuration,
        cycleSeed,
        width,
        height,
        window.devicePixelRatio || 1,
        [originX ?? width / 2, originY ?? height / 2],
        [red, green, blue, alpha],
      );
    };
    const tick = (now: number) => {
      draw(now);
      request = requestAnimationFrame(tick);
    };
    const resume = () => {
      stop();
      if (!renderer || document.hidden) return;
      start = performance.now();
      draw(start);
      if (!media.matches) request = requestAnimationFrame(tick);
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
  }, [red, green, blue, alpha, originX, originY, seed]);
  return (
    <canvas
      ref={ref}
      className={className}
      style={style}
      aria-hidden="true"
      data-ink-sparkle=""
    />
  );
}
