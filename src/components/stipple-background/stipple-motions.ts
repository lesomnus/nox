import {
  clamp,
  type StippleMetaball,
  type StippleMotion,
  type StippleMotionContext,
} from "./stipple-model";

const CLUSTER_COUNT = 6;
const BLOB_COUNT = CLUSTER_COUNT * 2;

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

function createClusterSampler(seed: number) {
  let random = randomSource(seed);
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
  const initialPairs = [...pairs];
  const births = pairs.map((pair) => pair.bornAt);
  const lifetimes = pairs.map((pair) => pair.life);
  const cycles = pairs.map(() => 0);
  const metaballs: StippleMetaball[] = Array.from(
    { length: BLOB_COUNT },
    () => ({
      x: 0,
      y: 0,
      radius: 0,
      color: 0,
      influence: 0,
      wobble: 1,
    }),
  );
  return {
    sample(time: number, aspect: number) {
      const xScale = Math.min(1, aspect / 1.35);
      for (let i = 0; i < pairs.length; i++) {
        let pair = pairs[i];
        const cycle = Math.floor((time - births[i]) / lifetimes[i]);
        if (cycles[i] !== cycle) {
          // A cycle has its own seed, so seeking or skipping frames never changes its path.
          random = randomSource(
            (seed ^
              Math.imul(i + 1, 0x9e3779b9) ^
              Math.imul(cycle, 0x85ebca6b)) >>>
              0,
          );
          pair = pairs[i] =
            cycle === 0
              ? initialPairs[i]
              : makePair(i, births[i] + cycle * lifetimes[i]);
          pair.life = lifetimes[i];
          cycles[i] = cycle;
        }
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
        const r1 =
          pair.baseR1 *
          (0.58 +
            0.42 *
              (0.5 + 0.5 * Math.sin(time * pair.pulseRate1 + pair.pulse1))) *
          (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 0.1 + pair.sepPhase)));
        const r2 =
          pair.baseR2 *
          (0.58 +
            0.42 *
              (0.5 + 0.5 * Math.cos(time * pair.pulseRate2 + pair.pulse2))) *
          (0.3 + 0.7 * (0.5 + 0.5 * Math.cos(time * 0.11 + pair.pulse2)));
        const separation =
          (r1 + r2) * envelope * (0.12 + 2.35 * separationWave) * 0.5;
        const dx = Math.cos(direction) * separation * xScale;
        const dy = Math.sin(direction) * separation;
        const first = metaballs[i * 2],
          second = metaballs[i * 2 + 1];
        first.x = (cx - dx) / aspect + 0.5;
        first.y = 0.5 - (cy - dy);
        first.radius = r1;
        first.color = pair.color;
        first.influence = envelope;
        second.x = (cx + dx) / aspect + 0.5;
        second.y = 0.5 - (cy + dy);
        second.radius = r2;
        second.color = pair.color;
        second.influence = envelope;
      }
      return metaballs;
    },
  };
}

const samplers = new WeakMap<
  StippleMotionContext,
  {
    seed: number;
    sampler: ReturnType<typeof createClusterSampler>;
  }
>();

/** The original paired, drifting clusters, with staggered growth and disappearance. */
export const clusterMotion: StippleMotion = (t, context) => {
  const seed = context.seed >>> 0;
  let state = samplers.get(context);
  if (!state || state.seed !== seed) {
    state = { seed, sampler: createClusterSampler(seed) };
    samplers.set(context, state);
  }
  const time = Number.isFinite(t) ? Math.max(0, t) : 0;
  const aspect =
    Number.isFinite(context.aspect) && context.aspect > 0 ? context.aspect : 1;
  return state.sampler.sample(time, aspect);
};
