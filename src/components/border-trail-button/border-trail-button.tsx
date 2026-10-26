import {
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type CSSProperties,
} from "react";
import { Button, type ButtonProps } from "../button/button";
import styles from "./border-trail-button.module.css";

export type BorderTrailSegment = {
  /** Any CSS color; otherwise cycles through colors. */
  color?: string;
  /** Fraction of the full perimeter, clamped to 0–1. */
  length?: number;
  /** One clockwise lap in positive milliseconds. */
  duration?: number;
  /** Starting fraction of the perimeter; otherwise evenly distributed. */
  offset?: number;
};

export type BorderTrailButtonProps = Omit<ButtonProps, "decoration"> & {
  /** Fade the segments without changing the track or button layout. */
  active?: boolean;
  /** A segment count or individual segment settings. Zero leaves only the track. */
  segments?: number | readonly BorderTrailSegment[];
  /** CSS colors, cycled when there are more segments than colors. */
  colors?: readonly string[];
  /** Shared segment length as a fraction of the full perimeter. */
  segmentLength?: number;
  /** Shared lap duration in positive milliseconds; omitted follows the theme. */
  duration?: number;
};

const defaultColors = [
  "var(--ui-border-trail-color-1)",
  "var(--ui-border-trail-color-2)",
  "var(--ui-border-trail-color-3)",
];

function borderPath(node: HTMLButtonElement, inset: number) {
  const css = getComputedStyle(node);
  const width =
    parseFloat(css.width) -
    parseFloat(css.borderLeftWidth) -
    parseFloat(css.borderRightWidth);
  const height =
    parseFloat(css.height) -
    parseFloat(css.borderTopWidth) -
    parseFloat(css.borderBottomWidth);
  const radii = [
    css.borderTopLeftRadius,
    css.borderTopRightRadius,
    css.borderBottomRightRadius,
    css.borderBottomLeftRadius,
  ].map((value) => {
    const [horizontal, vertical = horizontal] = value.split(/\s+/);
    const pixels = (part: string, size: number) =>
      parseFloat(part) * (part.endsWith("%") ? size / 100 : 1);
    return [pixels(horizontal, width), pixels(vertical, height)];
  });
  // Apply CSS's shared corner reduction before insetting the stroke centerline.
  const factor = Math.min(
    1,
    width / (radii[0][0] + radii[1][0] || 1),
    width / (radii[3][0] + radii[2][0] || 1),
    height / (radii[0][1] + radii[3][1] || 1),
    height / (radii[1][1] + radii[2][1] || 1),
  );
  const [tl, tr, br, bl] = radii.map((corner) =>
    corner.map((value) => Math.max(0, value * factor - inset)),
  );
  const right = Math.max(inset, width - inset),
    bottom = Math.max(inset, height - inset);
  return `M ${inset + tl[0]} ${inset} H ${right - tr[0]} A ${tr[0]} ${tr[1]} 0 0 1 ${right} ${inset + tr[1]} V ${bottom - br[1]} A ${br[0]} ${br[1]} 0 0 1 ${right - br[0]} ${bottom} H ${inset + bl[0]} A ${bl[0]} ${bl[1]} 0 0 1 ${inset} ${bottom - bl[1]} V ${inset + tl[1]} A ${tl[0]} ${tl[1]} 0 0 1 ${inset + tl[0]} ${inset} Z`;
}

export function BorderTrailButton({
  active = true,
  segments = 3,
  colors,
  segmentLength,
  duration,
  className = "",
  style,
  ref,
  children,
  type = "button",
  ...props
}: BorderTrailButtonProps) {
  const button = useRef<HTMLButtonElement>(null);
  const border = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const id = useId();
  useImperativeHandle(ref, () => button.current!, []);
  const trails =
    typeof segments === "number"
      ? Array.from(
          {
            length: Number.isFinite(segments)
              ? Math.max(0, Math.floor(segments))
              : 0,
          },
          (): BorderTrailSegment => ({}),
        )
      : segments;
  const palette = colors?.length ? colors : defaultColors;

  useLayoutEffect(() => {
    const node = button.current!;
    const measure = () => {
      const stroke = parseFloat(getComputedStyle(border.current!).strokeWidth);
      path.current!.setAttribute("d", borderPath(node, stroke / 2));
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    return () => resize.disconnect();
  }, [className, style]);

  return (
    <Button
      {...props}
      ref={button}
      type={type}
      className={className}
      style={style}
      data-border-trail="root"
      decoration={
        <svg
          ref={border}
          className={styles.border}
          data-border-trail="border"
          data-active={active && trails.length > 0}
          aria-hidden="true"
          focusable="false"
          style={{ "--border-trail-count": trails.length } as CSSProperties}
        >
          <defs>
            <path ref={path} id={id} pathLength="100" />
          </defs>
          <use
            href={`#${id}`}
            className={styles.track}
            data-border-trail="track"
          />
          {trails.map((segment, index) => {
            const length = segment.length ?? segmentLength;
            const clampedLength =
              length !== undefined && Number.isFinite(length)
                ? 100 * Math.max(0, Math.min(1, length))
                : undefined;
            const lap = segment.duration ?? duration;
            const offset = Number.isFinite(segment.offset)
              ? segment.offset!
              : index / trails.length;
            return (
              <use
                key={index}
                href={`#${id}`}
                className={styles.segment}
                data-border-trail="segment"
                data-empty={clampedLength === 0 || undefined}
                style={
                  {
                    stroke: segment.color ?? palette[index % palette.length],
                    "--border-trail-offset": ((offset % 1) + 1) % 1,
                    ...(clampedLength !== undefined
                      ? { "--border-trail-length": clampedLength }
                      : {}),
                    ...(lap !== undefined && Number.isFinite(lap) && lap > 0
                      ? { "--border-trail-duration": `${lap}ms` }
                      : {}),
                  } as CSSProperties
                }
              />
            );
          })}
        </svg>
      }
    >
      {children}
    </Button>
  );
}
