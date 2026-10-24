import { useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { InkSparkle, type InkSparkleProps } from "../ink-sparkle/ink-sparkle";
import styles from "./progress.module.css";

export type ProgressSparkleOptions = Pick<
  InkSparkleProps,
  "color" | "sparkleColor" | "duration" | "seed"
>;

export type ProgressProps = Omit<
  ComponentProps<"div">,
  "children" | "role" | "aria-valuemin" | "aria-valuemax" | "aria-valuenow"
> & {
  value: number;
  max?: number;
  /** Animate value changes and loop InkSparkle inside the filled bar. */
  animated?: boolean;
  /** Bordered uses the shared narrow control inset. */
  variant?: "default" | "bordered";
  sparkleOptions?: ProgressSparkleOptions;
};

/** A boxed progress rail; application state and timing belong to the caller. */
export function Progress({
  value,
  max = 100,
  animated = true,
  variant = "default",
  sparkleOptions,
  className = "",
  ...props
}: ProgressProps) {
  const maximum = Number.isFinite(max) && max > 0 ? max : 100;
  const current = Number.isFinite(value)
    ? Math.min(maximum, Math.max(0, value))
    : 0;
  const fill = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const sparkling = animated && current > 0;
  useLayoutEffect(() => {
    if (!sparkling) return;
    const node = fill.current!;
    const measure = () => setHeight(node.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [sparkling]);

  return (
    <div
      {...props}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={maximum}
      aria-valuenow={current}
      className={`${styles.progress} ${className}`}
      data-progress="root"
      data-variant={variant}
      data-animated={animated || undefined}
    >
      <div className={styles.rail} data-progress="rail">
        <div
          ref={fill}
          className={styles.fill}
          data-progress="fill"
          style={{ width: `${(current / maximum) * 100}%` }}
        >
          {sparkling && height > 0 && (
            <InkSparkle
              className={styles.sparkle}
              color={[0, 0, 0, 0.24]}
              sparkleColor={[0, 0, 0, 0.8]}
              duration={2000}
              {...sparkleOptions}
              origin={[-2 * height, height / 2]}
              centerMotion="fixed"
              loop
            />
          )}
        </div>
      </div>
    </div>
  );
}
