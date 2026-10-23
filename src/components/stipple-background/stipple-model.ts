export type StipplePattern =
  | "bayer8"
  | "checker"
  | "diamond"
  | "hex"
  | "fractal";
export type StippleColor = `#${string}`;
export type StippleColors = readonly [StippleColor, StippleColor, StippleColor];
export type StipplePalette = readonly StippleColor[];
export type StippleColorBlend = "gradient" | "dither" | "none";
export const MAX_STIPPLE_METABALLS = 32;

export type StippleMetaball = {
  /** Position in viewport fractions: (0, 0) is top-left, (1, 1) bottom-right. */
  x: number;
  y: number;
  /** Radius as a fraction of the container height. */
  radius: number;
  /** Palette index; defaults to the metaball's array index. */
  color?: number;
  /** Ellipse axis multipliers; defaults to [1, 1]. */
  scale?: readonly [number, number];
  /** Clockwise rotation in radians. */
  rotation?: number;
  /** Organic boundary deformation, from zero (smooth ellipse) to one. */
  wobble?: number;
  /** Growth/fade envelope from zero to one; defaults to one. */
  influence?: number;
};
export type StippleMotionContext = Readonly<{
  /** Container dimensions in CSS pixels. */
  width: number;
  height: number;
  aspect: number;
  seed: number;
}>;
export type StippleMotion = (
  /** Simulation seconds, after speed and pause are applied. */
  t: number,
  context: StippleMotionContext,
) => readonly StippleMetaball[];

export type StippleSettings = {
  /** Simulation time multiplier; zero keeps a still image. */
  speed?: number;
  /** Grain spacing in CSS pixels, before the shader's lattice multiplier. */
  grainPx?: number;
  /** Spread of the stippled edge, using the supplied wallpaper's compressed scale. */
  scatterPx?: number;
  /** Same-color blending distance in height-normalized coordinates. */
  merge?: number;
  /** How overlapping colors combine; dither retains the exact palette colors. */
  colorBlend?: StippleColorBlend;
  /** Transition width in height-normalized coordinates; zero disables mixing. */
  colorBlendWidth?: number;
  /** Fade peripheral dot colors toward the background: zero is flat, one is full falloff. */
  edgeFade?: number;
  /** Maximum additional fade shades per base dot color; one gives a halfway shade. */
  edgeFadeSteps?: number;
  /** Replace the built-in movement with a synchronous time-based sampler. */
  motion?: StippleMotion;
  /** Maximum drawing-buffer width, independent of the container's CSS size. */
  maxWidth?: number;
  /** Drawing rate limit. */
  maxFps?: number;
  pattern?: StipplePattern;
  /** Candidate cluster colors, using short or full RGB hex strings. */
  palette?: StipplePalette;
  /** Three-color shorthand; palette takes precedence when provided. */
  colors?: StippleColors;
  backgroundColor?: StippleColor;
  /** Omit to choose a random arrangement once per mounted instance. */
  seed?: number;
  paused?: boolean;
};

const DEFAULT_COLORS: StippleColors = ["#b8e0f2", "#b3e6bd", "#c2baf0"];
const DEFAULT_PALETTE = new Float32Array(
  DEFAULT_COLORS.flatMap((c) => hexColor(c)!),
);
export const DEFAULT_BACKGROUND = "#0a1438";
const patterns: StipplePattern[] = [
  "bayer8",
  "checker",
  "diamond",
  "hex",
  "fractal",
];
const finite = (value: number | undefined, fallback: number) =>
  value !== undefined && Number.isFinite(value) ? value : fallback;
export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function hexColor(value: string) {
  const valid = /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value);
  if (!valid) return undefined;
  const hex = value.slice(1);
  const expanded = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  return [0, 2, 4].map((i) => parseInt(expanded.slice(i, i + 2), 16) / 255);
}

export function resolveStippleSettings(settings: StippleSettings) {
  const background =
    hexColor(settings.backgroundColor ?? "") ?? hexColor(DEFAULT_BACKGROUND)!;
  const palette = (
    settings.palette ??
    settings.colors ??
    DEFAULT_COLORS
  ).flatMap((color) => hexColor(color) ?? []);
  return {
    speed: Math.max(0, finite(settings.speed, 0.2)),
    grainPx: Math.max(0, finite(settings.grainPx, 1)),
    scatterPx: Math.max(0, finite(settings.scatterPx, 800)),
    merge: Math.max(0, finite(settings.merge, 0.01)),
    colorBlend:
      settings.colorBlend === "none"
        ? 0
        : settings.colorBlend === "dither"
          ? 2
          : 1,
    colorBlendWidth: Math.max(0, finite(settings.colorBlendWidth, 0.12)),
    edgeFade: clamp(finite(settings.edgeFade, 0), 0, 1),
    edgeFadeSteps: Math.max(0, Math.floor(finite(settings.edgeFadeSteps, 1))),
    motion: settings.motion,
    maxWidth: Math.max(1, finite(settings.maxWidth, 1200)),
    maxFps: clamp(finite(settings.maxFps, 30), 1, 60),
    pattern: patterns.includes(settings.pattern ?? "diamond")
      ? patterns.indexOf(settings.pattern ?? "diamond")
      : 2,
    palette: palette.length ? new Float32Array(palette) : DEFAULT_PALETTE,
    background: new Float32Array(background),
    backgroundCss: `rgb(${background.map((value) => Math.round(value * 255)).join(" ")})`,
    seed: finite(settings.seed, 1) >>> 0,
    paused: settings.paused ?? false,
  };
}
export type ResolvedStippleSettings = ReturnType<typeof resolveStippleSettings>;

export function rasterSize(
  width: number,
  height: number,
  dpr: number,
  maxWidth: number,
  maxDimension: number,
) {
  const scale = Math.min(
    Math.max(1, dpr),
    2,
    maxWidth / Math.max(1, width),
    maxDimension / Math.max(1, width, height),
  );
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
    scale,
  };
}
