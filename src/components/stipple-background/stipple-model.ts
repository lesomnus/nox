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

export const CLUSTER_COUNT = 6;
export const BLOB_COUNT = CLUSTER_COUNT * 2;

function randomSource(seed: number) {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clusterEnvelope = (progress: number) =>
  Math.min(smoothstep(0, 0.18, progress), 1 - smoothstep(0.68, 1, progress));

export function createStippleMotion(seed: number) {
  const random = randomSource(seed);
  const rand = (min: number, max: number) => min + random() * (max - min);
  function edge(exit = false) {
    const side = Math.floor(random() * 4);
    const margin = exit ? rand(0.25, 0.6) : rand(0.22, 0.42);
    if (side < 2)
      return {
        x: (side === 0 ? -1 : 1) * ((exit ? 1.15 : 1) + margin),
        y: rand(exit ? -0.8 : -0.65, exit ? 0.8 : 0.65),
      };
    return {
      x: rand(exit ? -0.95 : -0.8, exit ? 0.95 : 0.8),
      y: (side === 2 ? 1 : -1) * ((exit ? 1 : 0.9) + margin),
    };
  }
  function makePair(i: number, bornAt: number) {
    const inside = i % 2 === 0;
    const interior = () => ({ x: rand(-0.2, 0.2), y: rand(-0.2, 0.2) });
    return {
      color: bornAt <= 0 ? i : Math.floor(random() * 4294967296),
      inside,
      bornAt,
      life: rand(40, 68),
      from: inside ? interior() : edge(),
      target: inside
        ? interior()
        : { x: rand(-0.55, 0.55), y: rand(-0.38, 0.38) },
      exit: inside ? interior() : edge(true),
      heading: rand(0, Math.PI * 2),
      headingDrift: rand(-0.18, 0.18),
      sepPhase: rand(0, Math.PI * 2),
      sepRate: rand(0.3, 0.62),
      baseR1: rand(0.1, 0.18),
      baseR2: rand(0.08, 0.15),
      pulse1: rand(0, Math.PI * 2),
      pulse2: rand(0, Math.PI * 2),
      pulseRate1: rand(0.16, 0.36),
      pulseRate2: rand(0.15, 0.34),
      wobbleX: rand(0, Math.PI * 2),
      wobbleY: rand(0, Math.PI * 2),
    };
  }
  const pairs = Array.from({ length: CLUSTER_COUNT }, (_, i) =>
    makePair(i, rand(-30, 0)),
  );
  const blobs = new Float32Array(BLOB_COUNT * 4);
  const shapes = new Float32Array(BLOB_COUNT * 4);
  for (let i = 0; i < BLOB_COUNT; i++) shapes.set([1, 1, 0, 1], i * 4);
  const colors = new Float32Array(CLUSTER_COUNT * 3);
  const envelopes = new Float32Array(BLOB_COUNT);
  const colorSlots = new Int32Array(CLUSTER_COUNT);
  return {
    blobs,
    shapes,
    count: BLOB_COUNT,
    colorCount: CLUSTER_COUNT,
    colors,
    envelopes,
    sample(time: number, aspect: number, palette = DEFAULT_PALETTE) {
      const xScale = Math.min(1, aspect / 1.35);
      colorSlots.fill(-1);
      colors.fill(0);
      let slotCount = 0;
      let index = 0;
      for (let i = 0; i < pairs.length; i++) {
        let pair = pairs[i];
        if (time - pair.bornAt >= pair.life)
          pair = pairs[i] = makePair(i, time);
        const age = time - pair.bornAt;
        const life = age / pair.life;
        const entering = easeInOut(smoothstep(0, 0.22, life));
        const exiting = smoothstep(0.7, 1, life);
        const sway = pair.inside ? 0.04 : 0.16;
        let cx =
          lerp(pair.from.x, pair.target.x, entering) +
          sway * Math.sin(time * 0.08 + pair.wobbleX);
        let cy =
          lerp(pair.from.y, pair.target.y, entering) +
          sway * Math.cos(time * 0.07 + pair.wobbleY);
        cx = lerp(cx, pair.exit.x, exiting) * (pair.inside ? aspect : xScale);
        cy = lerp(cy, pair.exit.y, exiting);
        const direction =
          pair.heading +
          pair.headingDrift * age +
          0.55 * Math.sin(time * 0.05 + pair.sepPhase);
        const separationWave =
          0.5 - 0.5 * Math.cos(time * pair.sepRate + pair.sepPhase);
        const envelope = clusterEnvelope(life);
        envelopes[i * 2] = envelopes[i * 2 + 1] = envelope;
        const r1 =
          pair.baseR1 *
          (0.58 +
            0.42 *
              (0.5 + 0.5 * Math.sin(time * pair.pulseRate1 + pair.pulse1))) *
          envelope *
          (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 0.1 + pair.sepPhase)));
        const r2 =
          pair.baseR2 *
          (0.58 +
            0.42 *
              (0.5 + 0.5 * Math.cos(time * pair.pulseRate2 + pair.pulse2))) *
          envelope *
          (0.3 + 0.7 * (0.5 + 0.5 * Math.cos(time * 0.11 + pair.pulse2)));
        const separation = (r1 + r2) * (0.12 + 2.35 * separationWave) * 0.5;
        const dx = Math.cos(direction) * separation * xScale;
        const dy = Math.sin(direction) * separation;
        const paletteIndex = pair.color % (palette.length / 3);
        let slot = colorSlots.indexOf(paletteIndex);
        if (slot === -1) {
          slot = slotCount++;
          colorSlots[slot] = paletteIndex;
          for (let channel = 0; channel < 3; channel++)
            colors[slot * 3 + channel] = palette[paletteIndex * 3 + channel];
        }
        blobs[index++] = cx - dx;
        blobs[index++] = cy - dy;
        blobs[index++] = r1;
        blobs[index++] = slot;
        blobs[index++] = cx + dx;
        blobs[index++] = cy + dy;
        blobs[index++] = r2;
        blobs[index++] = slot;
      }
      return blobs;
    },
  };
}
