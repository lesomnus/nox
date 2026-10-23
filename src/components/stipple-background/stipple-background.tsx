import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
} from "react";
import { resolveStippleSettings, type StippleSettings } from "./stipple-model";
import { createStippleRenderer } from "./stipple-renderer";
import styles from "./stipple-background.module.css";

export type {
  StipplePattern,
  StippleColor,
  StippleColors,
} from "./stipple-model";
export type StippleBackgroundProps = Omit<ComponentProps<"div">, "onError"> &
  StippleSettings & {
    onError?: (error: Error) => void;
  };

export function StippleBackground({
  speed,
  grainPx,
  scatterPx,
  merge,
  maxWidth,
  maxFps,
  pattern,
  colors,
  backgroundColor,
  seed,
  paused,
  onError,
  children,
  className = "",
  style,
  ...props
}: StippleBackgroundProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createStippleRenderer>>(undefined);
  const errorHandler = useRef(onError);
  errorHandler.current = onError;
  const [status, setStatus] = useState<"pending" | "webgl2" | "fallback">(
    "pending",
  );
  const [firstColor, secondColor, thirdColor] = colors ?? [];
  const settings = useMemo(
    () =>
      resolveStippleSettings({
        speed,
        grainPx,
        scatterPx,
        merge,
        maxWidth,
        maxFps,
        pattern,
        colors,
        backgroundColor,
        seed,
        paused,
      }),
    [
      speed,
      grainPx,
      scatterPx,
      merge,
      maxWidth,
      maxFps,
      pattern,
      firstColor,
      secondColor,
      thirdColor,
      backgroundColor,
      seed,
      paused,
    ],
  );
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const instance = createStippleRenderer(
      element,
      settings,
      setStatus,
      (error) => errorHandler.current?.(error),
    );
    renderer.current = instance;
    return () => {
      instance.dispose();
      renderer.current = undefined;
    };
  }, []);
  useEffect(() => renderer.current?.update(settings), [settings]);
  return (
    <div
      {...props}
      className={`${styles.surface} ${className}`}
      data-renderer={status}
      style={
        {
          "--stipple-background": settings.backgroundCss,
          ...style,
        } as CSSProperties
      }
    >
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
      {children != null && <div className={styles.content}>{children}</div>}
    </div>
  );
}
