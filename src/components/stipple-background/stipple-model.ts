export type StipplePattern =
  | "bayer8"
  | "checker"
  | "diamond"
  | "hex"
  | "fractal";
export type StippleColor = `#${string}`;
export type StippleColors = readonly [StippleColor, StippleColor, StippleColor];

export type StippleSettings = {
  /** Simulation time multiplier; zero keeps a still image. */
  speed?: number;
  /** Grain spacing in CSS pixels, before the shader's lattice multiplier. */
  grainPx?: number;
  /** Spread of the stippled edge, using the supplied wallpaper's compressed scale. */
  scatterPx?: number;
  /** Same-color blending distance in height-normalized coordinates. */
  merge?: number;
  /** Maximum drawing-buffer width, independent of the container's CSS size. */
  maxWidth?: number;
  /** Drawing rate limit. */
  maxFps?: number;
  pattern?: StipplePattern;
  colors?: StippleColors;
  backgroundColor?: StippleColor;
  seed?: number;
  paused?: boolean;
};

const DEFAULT_COLORS: StippleColors = ["#b8e0f2", "#b3e6bd", "#c2baf0"];
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
  return {
    speed: Math.max(0, finite(settings.speed, 0.2)),
    grainPx: Math.max(0, finite(settings.grainPx, 1)),
    scatterPx: Math.max(0, finite(settings.scatterPx, 800)),
    merge: Math.max(0, finite(settings.merge, 0.01)),
    maxWidth: Math.max(1, finite(settings.maxWidth, 1200)),
    maxFps: clamp(finite(settings.maxFps, 30), 1, 60),
    pattern: patterns.includes(settings.pattern ?? "diamond")
      ? patterns.indexOf(settings.pattern ?? "diamond")
      : 2,
    colors: new Float32Array(
      DEFAULT_COLORS.flatMap(
        (color, i) => hexColor(settings.colors?.[i] ?? "") ?? hexColor(color)!,
      ),
    ),
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

const PAIR_COUNT = 6;
export const BLOB_COUNT = PAIR_COUNT * 2;

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
    return {
      color: i % 3,
      bornAt,
      life: rand(40, 68),
      from: edge(),
      target: { x: rand(-0.55, 0.55), y: rand(-0.38, 0.38) },
      exit: edge(true),
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
  const pairs = Array.from({ length: PAIR_COUNT }, (_, i) =>
    makePair(i, rand(-30, 0)),
  );
  const blobs = new Float32Array(BLOB_COUNT * 4);
  return {
    sample(time: number, aspect: number) {
      const xScale = Math.min(1, aspect / 1.35);
      let index = 0;
      for (let i = 0; i < pairs.length; i++) {
        let pair = pairs[i];
        if (time - pair.bornAt >= pair.life)
          pair = pairs[i] = makePair(i, time);
        const age = time - pair.bornAt;
        const life = age / pair.life;
        const entering = easeInOut(smoothstep(0, 0.22, life));
        const exiting = smoothstep(0.7, 1, life);
        let cx =
          lerp(pair.from.x, pair.target.x, entering) +
          0.16 * Math.sin(time * 0.08 + pair.wobbleX);
        let cy =
          lerp(pair.from.y, pair.target.y, entering) +
          0.13 * Math.cos(time * 0.07 + pair.wobbleY);
        cx = lerp(cx, pair.exit.x, exiting) * xScale;
        cy = lerp(cy, pair.exit.y, exiting);
        const direction =
          pair.heading +
          pair.headingDrift * age +
          0.55 * Math.sin(time * 0.05 + pair.sepPhase);
        const separationWave =
          0.5 - 0.5 * Math.cos(time * pair.sepRate + pair.sepPhase);
        const envelope = Math.min(
          smoothstep(0, 0.18, life),
          1 - smoothstep(0.68, 1, life),
        );
        const r1 = Math.max(
          0.0001,
          pair.baseR1 *
            (0.58 +
              0.42 *
                (0.5 + 0.5 * Math.sin(time * pair.pulseRate1 + pair.pulse1))) *
            envelope *
            (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 0.1 + pair.sepPhase))),
        );
        const r2 = Math.max(
          0.0001,
          pair.baseR2 *
            (0.58 +
              0.42 *
                (0.5 + 0.5 * Math.cos(time * pair.pulseRate2 + pair.pulse2))) *
            envelope *
            (0.3 + 0.7 * (0.5 + 0.5 * Math.cos(time * 0.11 + pair.pulse2))),
        );
        const separation = (r1 + r2) * (0.12 + 2.35 * separationWave) * 0.5;
        const dx = Math.cos(direction) * separation * xScale;
        const dy = Math.sin(direction) * separation;
        blobs[index++] = cx - dx;
        blobs[index++] = cy - dy;
        blobs[index++] = r1;
        blobs[index++] = pair.color;
        blobs[index++] = cx + dx;
        blobs[index++] = cy + dy;
        blobs[index++] = r2;
        blobs[index++] = pair.color;
      }
      return blobs;
    },
  };
}
