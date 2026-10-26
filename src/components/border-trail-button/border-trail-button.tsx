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

export type BorderTrailProgress = {
  value: number;
  /** Units that grow one color to its near-full length. */
  perSegment: number;
  /** Maximum perimeter fraction per color; omitted follows the theme. */
  maxLength?: number;
};

export type BorderTrailSheen = {
  /** Travel time from a segment's start to its end, in positive milliseconds. */
  duration?: number;
  /** Highlight width as a fraction of its segment. */
  length?: number;
  strength?: number;
  color?: string;
};

export type BorderTrailButtonProps = Omit<ButtonProps, "decoration"> & {
  /** Fade the segments without changing the track or button layout. */
  active?: boolean;
  /** A segment count or individual segment settings. Zero leaves only the track. */
  segments?: number | readonly BorderTrailSegment[];
  /** Grow successive colors instead of using the segments configuration. */
  progress?: BorderTrailProgress;
  /** Periodic light traveling within each segment. Defaults to off. */
  sheen?: boolean | BorderTrailSheen;
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
  progress,
  sheen = false,
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
  const steps =
    progress &&
    Number.isFinite(progress.value) &&
    Number.isFinite(progress.perSegment) &&
    progress.perSegment > 0
      ? Math.max(0, progress.value) / progress.perSegment
      : 0;
  const trails: readonly BorderTrailSegment[] = progress
    ? Array.from({ length: Math.ceil(steps) }, () => ({ offset: 0 }))
    : typeof segments === "number"
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
  const shine = typeof sheen === "object" ? sheen : {};
  const growthLimit =
    progress?.maxLength !== undefined && Number.isFinite(progress.maxLength)
      ? 100 * Math.max(0, Math.min(1, progress.maxLength))
      : undefined;
  const showSheen =
    !!sheen &&
    !(shine.length !== undefined && shine.length <= 0) &&
    !(shine.strength !== undefined && shine.strength <= 0);

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
          style={
            {
              "--border-trail-count": trails.length,
              ...(shine.duration !== undefined &&
              Number.isFinite(shine.duration) &&
              shine.duration > 0
                ? { "--border-trail-sheen-duration": `${shine.duration}ms` }
                : {}),
              ...(shine.length !== undefined && Number.isFinite(shine.length)
                ? {
                    "--border-trail-sheen-length": Math.max(
                      0,
                      Math.min(1, shine.length),
                    ),
                  }
                : {}),
              ...(shine.strength !== undefined &&
              Number.isFinite(shine.strength)
                ? {
                    "--border-trail-sheen-strength": Math.max(
                      0,
                      Math.min(1, shine.strength),
                    ),
                  }
                : {}),
              ...(shine.color
                ? { "--border-trail-sheen-color": shine.color }
                : {}),
            } as CSSProperties
          }
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
            const length = progress
              ? undefined
              : (segment.length ?? segmentLength);
            const clampedLength =
              length !== undefined && Number.isFinite(length)
                ? 100 * Math.max(0, Math.min(1, length))
                : undefined;
            const lap = segment.duration ?? duration;
            const offset = Number.isFinite(segment.offset)
              ? segment.offset!
              : index / trails.length;
            const fill = Math.min(1, Math.max(0, steps - index));
            const mask = `${id}-sheen-${index}`;
            return (
              <g
                key={index}
                style={
                  {
                    stroke: segment.color ?? palette[index % palette.length],
                    "--border-trail-offset": ((offset % 1) + 1) % 1,
                    ...(progress
                      ? {
                          "--border-trail-length": `calc(${fill} * var(--border-trail-growth-limit, var(--ui-border-trail-progress-length)))`,
                        }
                      : {}),
                    ...(growthLimit !== undefined
                      ? { "--border-trail-growth-limit": growthLimit }
                      : {}),
                    ...(clampedLength !== undefined
                      ? { "--border-trail-length": clampedLength }
                      : {}),
                    ...(lap !== undefined && Number.isFinite(lap) && lap > 0
                      ? { "--border-trail-duration": `${lap}ms` }
                      : {}),
                  } as CSSProperties
                }
              >
                <use
                  href={`#${id}`}
                  className={styles.segment}
                  data-border-trail="segment"
                  data-empty={
                    clampedLength === 0 || growthLimit === 0 || undefined
                  }
                />
                {showSheen && (
                  <>
                    <mask
                      id={mask}
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width="100%"
                      height="100%"
                    >
                      <use href={`#${id}`} className={styles.clip} />
                    </mask>
                    <use
                      href={`#${id}`}
                      className={styles.sheen}
                      mask={`url(#${mask})`}
                      data-border-trail="sheen"
                      data-empty={
                        clampedLength === 0 || growthLimit === 0 || undefined
                      }
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      }
    >
      {children}
    </Button>
  );
}
