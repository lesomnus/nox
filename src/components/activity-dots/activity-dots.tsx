import type { CSSProperties, SVGProps } from "react";
import { activityDots, activityPattern } from "./activity-pattern";
import styles from "./activity-dots.module.css";
export { activityDots, activityPattern } from "./activity-pattern";
export type ActivityDotsProps = SVGProps<SVGSVGElement> & {
  seed?: number;
  palette?: readonly string[];
  dotClassName?: string;
  step?: number;
};
export function ActivityDots({
  seed = 0,
  palette,
  dotClassName = "",
  step,
  className = "",
  style,
  ...props
}: ActivityDotsProps) {
  const pattern = activityPattern(seed, palette);
  return (
    <svg
      width="12"
      height="16"
      viewBox="0 0 12 16"
      aria-hidden="true"
      {...props}
      className={`${styles.root} ${className}`}
      style={
        {
          ...(step === undefined
            ? {}
            : { "--ui-activity-dot-step": `${Math.max(0, step)}ms` }),
          ...style,
        } as CSSProperties
      }
    >
      {activityDots.map(([cx, cy], index) => (
        <circle
          key={index}
          cx={cx}
          cy={cy}
          r="1.3"
          className={`${styles.dot} ${dotClassName}`}
          style={
            {
              animationDelay: `calc((${index} + ${pattern.phase}) * var(--ui-activity-dot-step) * -1)`,
              "--ui-activity-dot-highlight": pattern.colors[index],
            } as CSSProperties
          }
        />
      ))}
    </svg>
  );
}
