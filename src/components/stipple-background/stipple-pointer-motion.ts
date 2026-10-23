import {
  MAX_STIPPLE_METABALLS,
  clamp,
  type StippleMetaball,
  type StippleMotion,
  type StippleMotionContext,
} from "./stipple-model";

export type StipplePointerBurstOptions = {
  /** Maximum added fields; base samples take priority within the shared GPU limit. */
  maxParticles?: number;
};
const sources = new WeakMap<StippleMotion, StippleMotion>();
const invisible: StippleMetaball = Object.freeze({
  x: 0,
  y: 0,
  radius: 0,
  influence: 0,
});
export function pointerBaseMotion(motion: StippleMotion): StippleMotion {
  let base = motion;
  while (sources.has(base)) base = sources.get(base)!;
  return base;
}
const smooth = (value: number) => {
  const x = clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
};
function createTrail(seed: number, count: number) {
  let rng = seed;
  const random = () => {
    rng += 0x6d2b79f5;
    let v = Math.imul(rng ^ (rng >>> 15), 1 | rng);
    v ^= v + Math.imul(v ^ (v >>> 7), 61 | v);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
  const particles = Array.from({ length: count }, () => ({
    born: -Infinity,
    life: 1,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 0,
    sample: {
      x: 0,
      y: 0,
      radius: 0,
      influence: 0,
      deformation: 0.8,
      wobble: 0.5,
    } as StippleMetaball,
  }));
  const output: StippleMetaball[] = [];
  let anchor: { x: number; y: number } | undefined;
  let sequence = -1,
    emittedAt = -Infinity,
    serial = 0;
  let path = -1;
  let baseSlots = 0;
  let width = 0,
    height = 0;
  return {
    sample(
      base: readonly StippleMetaball[],
      now: number,
      context: StippleMotionContext,
    ) {
      const baseCount = Math.min(base.length, MAX_STIPPLE_METABALLS);
      const hasLiveParticles = particles.some((p) => now - p.born < p.life);
      baseSlots = Math.max(baseCount, hasLiveParticles ? baseSlots : 0);
      const capacity = Math.min(count, MAX_STIPPLE_METABALLS - baseSlots);
      if (width !== context.width || height !== context.height)
        anchor = undefined;
      width = context.width;
      height = context.height;
      const pointer = context.pointer;
      if (pointer?.path !== path) anchor = undefined;
      if (context.reducedMotion) for (const p of particles) p.born = -Infinity;
      const enabled =
        context.active !== false && !context.reducedMotion && !!pointer?.inside;
      if (!enabled) anchor = undefined;
      function emit(x: number, y: number, amount: number) {
        const heading = random() * Math.PI * 2;
        for (let i = 0; i < amount; i++) {
          const p = particles.find(
            (p, index) => index < capacity && now - p.born >= p.life,
          );
          if (!p) break;
          const angle =
            heading + (i / amount) * Math.PI * 2 + (random() - 0.5) * 0.3;
          const speed = 0.24 + random() * 0.2;
          p.born = now;
          p.life = 0.55 + random() * 0.3;
          p.x = x;
          p.y = y;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
          p.radius = 0.02 + random() * 0.06;
          p.sample.color = serial++;
        }
      }
      if (enabled && pointer && pointer.sequence !== sequence) {
        if (Number.isFinite(pointer.x) && Number.isFinite(pointer.y)) {
          if (!anchor) {
            emit(pointer.x, pointer.y, 3);
            emittedAt = now;
            anchor = { x: pointer.x, y: pointer.y };
          } else {
            const distance = Math.hypot(
              (pointer.x - anchor.x) * width,
              (pointer.y - anchor.y) * height,
            );
            const steps = Math.min(
              4,
              Math.floor(distance / 18),
              Math.floor((now - emittedAt + 1e-9) / 0.06),
            );
            for (let i = 1; i <= steps; i++)
              emit(
                anchor.x + ((pointer.x - anchor.x) * i) / steps,
                anchor.y + ((pointer.y - anchor.y) * i) / steps,
                2,
              );
            if (steps > 0) {
              anchor = { x: pointer.x, y: pointer.y };
              emittedAt = now;
            }
          }
        }
      }
      sequence = pointer?.sequence ?? -1;
      path = pointer?.path ?? -1;
      output.length = baseCount;
      for (let i = 0; i < baseCount; i++) output[i] = base[i];
      let alive = false;
      const aspect =
        Number.isFinite(context.aspect) && context.aspect > 0
          ? context.aspect
          : 1;
      for (let i = 0; i < capacity; i++) {
        const p = particles[i],
          age = Math.max(0, now - p.born);
        const remaining = Math.max(0, 1 - age / p.life);
        p.sample.influence = context.reducedMotion
          ? 0
          : smooth(remaining / 0.25) * smooth(age / 0.28);
        const travel = 0.7 * (1 - Math.exp(-age / 0.7));
        p.sample.x = p.x + (p.vx * travel) / aspect;
        p.sample.y = p.y + p.vy * travel;
        p.sample.radius = p.radius * remaining;
        alive ||= age < p.life;
      }
      if (alive && !context.reducedMotion) {
        output.length = baseSlots + capacity;
        for (let i = baseCount; i < baseSlots; i++) output[i] = invisible;
        for (let i = 0; i < capacity; i++)
          output[baseSlots + i] = particles[i].sample;
      }
      return output;
    },
  };
}

/** Decorate any motion with short-lived, outward-moving fields along local pointer movement. */
export function withPointerBurst(
  motion: StippleMotion,
  options: StipplePointerBurstOptions = {},
): StippleMotion {
  const requested = options.maxParticles ?? 20;
  const count = clamp(
    Math.floor(Number.isFinite(requested) ? requested : 20),
    0,
    MAX_STIPPLE_METABALLS,
  );
  const states = new WeakMap<
    StippleMotionContext,
    { seed: number; time: number; trail: ReturnType<typeof createTrail> }
  >();
  const composed: StippleMotion = (t, context) => {
    const now = Number.isFinite(context.elapsed)
      ? Math.max(0, context.elapsed!)
      : Math.max(0, Number.isFinite(t) ? t : 0);
    const seed = context.seed >>> 0;
    let state = states.get(context);
    if (!state || state.seed !== seed || now < state.time) {
      state = { seed, time: now, trail: createTrail(seed, count) };
      states.set(context, state);
    }
    state.time = now;
    return state.trail.sample(motion(t, context), now, context);
  };
  sources.set(composed, motion);
  return composed;
}
