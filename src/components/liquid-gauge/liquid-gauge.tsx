import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { LIQUID_GAUGE_VIEWBOX, liquidEmptyContour } from "./liquid-gauge-model";
import styles from "./liquid-gauge.module.css";
export { LIQUID_GAUGE_VIEWBOX, liquidEmptyContour } from "./liquid-gauge-model";
export type LiquidGaugeProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
> & {
  value?: number;
  children?: ReactNode;
  tint?: string;
  classNames?: { vessel?: string; empty?: string; value?: string };
};
export function LiquidGauge({
  value,
  children,
  tint,
  className = "",
  classNames = {},
  style,
  ...props
}: LiquidGaugeProps) {
  const percent =
    value === undefined || !Number.isFinite(value)
      ? undefined
      : Math.max(0, Math.min(100, value));
  return (
    <span
      {...props}
      className={`${styles.gauge} ${className}`}
      data-unknown={percent === undefined || undefined}
      style={
        {
          ...(tint ? { "--ui-liquid-tint": tint } : {}),
          ...style,
        } as CSSProperties
      }
    >
      <span
        className={`${styles.vessel} ${classNames.vessel ?? ""}`}
        data-liquid-vessel=""
        aria-hidden="true"
      >
        <svg
          className={`${styles.empty} ${classNames.empty ?? ""}`}
          data-liquid-empty=""
          viewBox={LIQUID_GAUGE_VIEWBOX}
          preserveAspectRatio="none"
        >
          <path data-liquid-contour="" d={liquidEmptyContour(percent)} />
        </svg>
      </span>
      <span
        className={`${styles.value} ${classNames.value ?? ""}`}
        role={percent === undefined ? "img" : "meter"}
        aria-label={props["aria-label"] ?? "Remaining"}
        aria-valuemin={percent === undefined ? undefined : 0}
        aria-valuemax={percent === undefined ? undefined : 100}
        aria-valuenow={percent}
        aria-valuetext={
          props["aria-valuetext"] ??
          (percent === undefined ? undefined : `${percent}%`)
        }
      >
        {children}
      </span>
    </span>
  );
}
