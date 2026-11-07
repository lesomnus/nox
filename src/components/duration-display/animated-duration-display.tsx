import { DurationDisplay, type DurationDisplayProps } from "./duration-display";
import {
  useValueMotion,
  type ValueMotionOptions,
} from "../../hooks/use-value-motion";

export type AnimatedDurationDisplayProps = DurationDisplayProps &
  Pick<ValueMotionOptions, "spatialDelay" | "characterJitter"> & {
    animate?: boolean;
  };

export function AnimatedDurationDisplay({
  animate = true,
  spatialDelay,
  characterJitter,
  ...props
}: AnimatedDurationDisplayProps) {
  const motion = useValueMotion({
    ...props,
    spatialDelay,
    characterJitter,
    enabled:
      animate &&
      props.durationMs !== undefined &&
      Number.isFinite(props.durationMs),
  });
  return (
    <DurationDisplay {...props} {...motion} motion={props.motion ?? "slide"} />
  );
}
