import {
  clamp,
  type StippleMetaball,
  type StippleMotion,
  type StippleMotionContext,
} from "./stipple-model";

const COUNT = 10;
const STEP = 1 / 120;
const MAX_STEPS = 120;
const EMPTY: readonly StippleMetaball[] = [];
const smooth = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

function randomSource(seed: number) {
  let rng = seed;
  return () => {
    rng += 0x6d2b79f5;
    let v = Math.imul(rng ^ (rng >>> 15), 1 | rng);
    v ^= v + Math.imul(v ^ (v >>> 7), 61 | v);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}

function createWork(
  seed: number,
  aspect: number,
  time: number,
  active: boolean,
) {
  const random = randomSource(seed);
  const between = (min: number, max: number) => min + random() * (max - min);
  function appearance(i: number, random: () => number) {
    const between = (min: number, max: number) => min + random() * (max - min);
    let x = between(-0.38, 0.38) * aspect,
      y = between(0.15, 0.85);
    if (i % 2) {
      const edge = Math.floor(random() * 4);
      if (edge < 2) x = (edge ? 1 : -1) * (aspect * 0.5 + 0.18);
      else y = edge === 2 ? -0.18 : 1.18;
    }
    const heading =
      i % 2
        ? Math.atan2(
            between(0.15, 0.85) - y,
            between(-0.35, 0.35) * aspect - x,
          ) + between(-0.5, 0.5)
        : between(0, Math.PI * 2);
    const speed = between(0.05, 0.12);
    // Spread size classes across the array so even a small population has distinct sizes.
    const size = (((i * 7) % COUNT) + random()) / COUNT;
    return {
      x,
      y,
      entered: i % 2 === 0,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed,
      ax: 0,
      ay: 0,
      radius: 0.055 + 0.25 * size ** 1.5,
      phase: between(0, Math.PI * 2),
      pulsePhase: between(0, Math.PI * 2),
      pulseRate: between(0.25, 0.7),
      slowPulseRate: between(0.07, 0.2),
    };
  }
  const bodies = Array.from({ length: COUNT }, (_, i) => {
    const initial = appearance(i, random);
    const lifetimeRandom = randomSource(seed ^ Math.imul(i + 1, 0x27d4eb2d));
    const fadeAt = 8 + lifetimeRandom() * 12;
    const dissolve = 3 + lifetimeRandom() * 3;
    return {
      ...initial,
      delay: i === 0 ? 0 : between(0.1, 1.6),
      grow: between(1.8, 4.2),
      fade: between(0.55, 1.35),
      from: 0,
      influence: 0,
      life: 1,
      cycle: 0,
      fadeAt,
      dissolve,
      period: fadeAt + dissolve + 0.5 + lifetimeRandom(),
    };
  });
  const samples: StippleMetaball[] = bodies.map((body, color) => ({
    x: body.x / aspect + 0.5,
    y: body.y,
    radius: body.radius,
    color,
    influence: 0,
    wobble: 0.6,
    deformation: 0.75,
    scale: [1, 1],
    rotation: 0,
  }));
  let phaseTime = time,
    integrated = time,
    lastTime = time;
  let working = active,
    reduced = false,
    started = active;
  let lifeBase = 0,
    lifeStartedAt = time;
  const lifeTime = (t: number) =>
    lifeBase + (working && !reduced ? Math.max(0, t - lifeStartedAt) : 0);

  function renew(t: number) {
    const age = lifeTime(t);
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      const cycle = Math.floor(age / b.period);
      if (cycle === b.cycle) continue;
      const random = randomSource(
        seed ^ Math.imul(i + 1, 0x9e3779b9) ^ Math.imul(cycle, 0x85ebca6b),
      );
      Object.assign(b, appearance(i, random));
      b.cycle = cycle;
    }
  }

  function envelope(t: number) {
    for (const b of bodies) {
      const age = Math.max(0, t - phaseTime);
      const progress = smooth(
        working ? (age - b.delay) / b.grow : age / b.fade,
      );
      b.influence = reduced
        ? Number(working)
        : b.from + (Number(working) - b.from) * progress;
      const ageInCycle = lifeTime(t) - b.cycle * b.period;
      const growing =
        b.cycle === 0
          ? 1
          : smooth((ageInCycle - Math.max(0.25, b.delay)) / b.grow);
      b.life = reduced
        ? 1
        : growing * (1 - smooth((ageInCycle - b.fadeAt) / b.dissolve));
    }
  }

  function integrate(t: number) {
    for (const b of bodies) {
      // Gentle wandering and a soft boundary, rather than reflections at a wall.
      b.entered ||= Math.abs(b.x) <= aspect * 0.5 && b.y >= 0 && b.y <= 1;
      const confinement = b.entered ? 2 : 0.25;
      b.ax =
        0.018 * Math.sin(t * 0.47 + b.phase) -
        (Math.sign(b.x) *
          Math.max(0, Math.abs(b.x) - aspect * 0.46) *
          confinement) /
          Math.min(1, aspect);
      b.ay =
        0.018 * Math.cos(t * 0.39 + b.phase * 1.7) -
        Math.sign(b.y - 0.5) *
          Math.max(0, Math.abs(b.y - 0.5) - 0.45) *
          confinement;
    }
    for (let i = 0; i < COUNT; i++)
      for (let j = i + 1; j < COUNT; j++) {
        const a = bodies[i],
          b = bodies[j];
        const dx = b.x - a.x,
          dy = b.y - a.y;
        const squared = dx * dx + dy * dy;
        const distance = Math.sqrt(squared + 0.0001);
        // Nearby fields interact without pulling the entire population into one cluster.
        const clearance = 0.12 + 1.1 * (a.radius + b.radius);
        const overlap = Math.max(0, 1 - distance / clearance);
        const force =
          ((0.0007 * Math.exp(-squared / 0.8)) / (squared + 0.15) -
            0.12 * overlap * overlap) *
          Math.sqrt(a.influence * a.life * b.influence * b.life);
        const fx = (dx / distance) * force,
          fy = (dy / distance) * force;
        a.ax += fx;
        a.ay += fy;
        b.ax -= fx;
        b.ay -= fy;
      }
    for (const b of bodies) {
      b.vx = (b.vx + b.ax * STEP) * Math.exp(-0.06 * STEP);
      b.vy = (b.vy + b.ay * STEP) * Math.exp(-0.06 * STEP);
      const limit = Math.min(
        1,
        0.24 / Math.max(0.0001, Math.hypot(b.vx, b.vy)),
      );
      b.vx *= limit;
      b.vy *= limit;
      b.x += b.vx * STEP;
      b.y += b.vy * STEP;
    }
  }

  return {
    sample(
      t: number,
      nextAspect: number,
      nextActive: boolean,
      nextReduced: boolean,
    ) {
      if (nextAspect !== aspect) {
        for (const b of bodies) {
          b.x *= nextAspect / aspect;
          b.vx *= nextAspect / aspect;
        }
        aspect = nextAspect;
      }
      // Catch-up work is bounded even if a custom caller skips far ahead.
      integrated = Math.max(integrated, t - MAX_STEPS * STEP);
      const steps = Math.min(
        MAX_STEPS,
        Math.floor((t - integrated + 1e-9) / STEP),
      );
      for (let step = 0; step < steps; step++) {
        if (working && !reduced) renew(integrated);
        envelope(integrated);
        if (started && !reduced) integrate(integrated);
        integrated += STEP;
      }
      envelope(t);
      if (working !== nextActive || reduced !== nextReduced) {
        for (const b of bodies) b.from = b.influence;
        lifeBase = lifeTime(t);
        lifeStartedAt = t;
        phaseTime = t;
        working = nextActive;
        reduced = nextReduced;
        started ||= working;
        envelope(t);
      }
      lastTime = t;
      const ahead = Math.max(0, t - integrated);
      for (let i = 0; i < COUNT; i++) {
        const b = bodies[i],
          ball = samples[i];
        ball.x = (b.x + b.vx * ahead) / aspect + 0.5;
        ball.y = b.y + b.vy * ahead;
        if (reduced) {
          ball.x = clamp(ball.x, 0.12, 0.88);
          ball.y = clamp(ball.y, 0.12, 0.88);
        }
        ball.radius =
          b.radius *
          (0.64 +
            0.24 * Math.sin(t * b.pulseRate + b.phase) +
            0.12 * Math.sin(t * b.slowPulseRate + b.pulsePhase));
        ball.influence = b.influence * b.life;
        ball.deformation =
          0.55 +
          0.4 * (0.5 + 0.5 * Math.sin(t * b.slowPulseRate + b.pulsePhase));
        const shape = ball.scale as [number, number];
        shape[0] = 1 + 0.22 * Math.sin(t * 0.23 + b.phase);
        shape[1] = 1 + 0.17 * Math.cos(t * 0.29 + b.phase);
        ball.rotation = b.phase + t * 0.09;
      }
      return !working && bodies.every((b) => b.influence === 0)
        ? EMPTY
        : samples;
    },
    get time() {
      return lastTime;
    },
  };
}

const workStates = new WeakMap<
  StippleMotionContext,
  { seed: number; work: ReturnType<typeof createWork> }
>();

/** Blooms on activity, drifts under mutual forces, then shrinks away while still moving. */
export const workMotion: StippleMotion = (t, context) => {
  const time = Number.isFinite(t) ? Math.max(0, t) : 0;
  const seed = context.seed >>> 0;
  const aspect =
    Number.isFinite(context.aspect) && context.aspect > 0 ? context.aspect : 1;
  const active = context.active ?? true;
  let state = workStates.get(context);
  if (!state || state.seed !== seed || time < state.work.time) {
    state = { seed, work: createWork(seed, aspect, time, active) };
    workStates.set(context, state);
  }
  return state.work.sample(
    time,
    aspect,
    active,
    context.reducedMotion ?? false,
  );
};
