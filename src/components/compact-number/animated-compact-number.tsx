import { CompactNumber, type CompactNumberProps } from "./compact-number";
import {
  useValueMotion,
  type ValueMotionOptions,
} from "../../hooks/use-value-motion";

export type AnimatedCompactNumberProps = CompactNumberProps &
  Pick<ValueMotionOptions, "spatialDelay" | "characterJitter"> & {
    /** False shows cached/already-known values immediately. */
    animate?: boolean;
  };

/** Bounded slides, placeholder/color reveal, spatial staggering and visibility policy. */
export function AnimatedCompactNumber({
  animate = true,
  spatialDelay,
  characterJitter,
  ...props
}: AnimatedCompactNumberProps) {
  const motion = useValueMotion({
    ...props,
    spatialDelay,
    characterJitter,
    enabled: animate && Number.isFinite(props.value),
  });
  // Keep AnimatedText mounted across unknown/cache values so fresh updates start
  // at the displayed value instead of remounting from dashes.
  return (
    <CompactNumber {...props} {...motion} motion={props.motion ?? "slide"} />
  );
}
