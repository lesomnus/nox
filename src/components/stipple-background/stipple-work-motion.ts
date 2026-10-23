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

function createWork(
  seed: number,
  aspect: number,
  time: number,
  active: boolean,
) {
  let rng = seed;
  const random = () => {
    rng += 0x6d2b79f5;
    let v = Math.imul(rng ^ (rng >>> 15), 1 | rng);
    v ^= v + Math.imul(v ^ (v >>> 7), 61 | v);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
  const between = (min: number, max: number) => min + random() * (max - min);
  const bodies = Array.from({ length: COUNT }, (_, i) => {
    let x = between(-0.38, 0.38) * aspect,
      y = between(0.15, 0.85);
    if (i % 2) {
      const edge = Math.floor(random() * 4);
      if (edge < 2) x = (edge ? 1 : -1) * (aspect * 0.5 + 0.18);
      else y = edge === 2 ? -0.18 : 1.18;
    }
    const heading = Math.atan2(0.5 - y, -x) + between(-0.6, 0.6);
    const speed = between(0.08, 0.15);
    return {
      x,
      y,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed,
      ax: 0,
      ay: 0,
      radius: between(0.12, 0.21),
      phase: between(0, Math.PI * 2),
      delay: i === 0 ? 0 : between(0, 0.35),
      grow: between(0.5, 1.1),
      fade: between(0.55, 1.35),
      from: 0,
      influence: 0,
    };
  });
  const samples: StippleMetaball[] = bodies.map((body, color) => ({
    x: body.x / aspect + 0.5,
    y: body.y,
    radius: body.radius,
    color,
    influence: 0,
    wobble: 0.6,
    scale: [1, 1],
    rotation: 0,
  }));
  let phaseTime = time,
    integrated = time,
    lastTime = time;
  let working = active,
    reduced = false,
    started = active;

  function envelope(t: number) {
    for (const b of bodies) {
      const age = Math.max(0, t - phaseTime);
      const progress = smooth(
        working ? (age - b.delay) / b.grow : age / b.fade,
      );
      b.influence = reduced
        ? Number(working)
        : b.from + (Number(working) - b.from) * progress;
    }
  }

  function integrate(t: number) {
    for (const b of bodies) {
      // Gentle wandering and a soft boundary, rather than reflections at a wall.
      b.ax =
        0.018 * Math.sin(t * 0.47 + b.phase) -
        Math.sign(b.x) * Math.max(0, Math.abs(b.x) - aspect * 0.4) * 0.7;
      b.ay =
        0.018 * Math.cos(t * 0.39 + b.phase * 1.7) -
        Math.sign(b.y - 0.5) * Math.max(0, Math.abs(b.y - 0.5) - 0.36) * 0.7;
    }
    for (let i = 0; i < COUNT; i++)
      for (let j = i + 1; j < COUNT; j++) {
        const a = bodies[i],
          b = bodies[j];
        const dx = b.x - a.x,
          dy = b.y - a.y;
        const squared = dx * dx + dy * dy;
        const distance = Math.sqrt(squared + 0.0001);
        // Softened attraction, with close-range repulsion; each pair gets equal and opposite forces.
        const force =
          (0.004 / (squared + 0.08) - 0.25 * Math.exp(-squared / 0.04)) *
          Math.sqrt(a.influence * b.influence);
        const fx = (dx / distance) * force,
          fy = (dy / distance) * force;
        a.ax += fx;
        a.ay += fy;
        b.ax -= fx;
        b.ay -= fy;
      }
    for (const b of bodies) {
      b.vx = (b.vx + b.ax * STEP) * Math.exp(-0.12 * STEP);
      b.vy = (b.vy + b.ay * STEP) * Math.exp(-0.12 * STEP);
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
        envelope(integrated);
        if (started && !reduced) integrate(integrated);
        integrated += STEP;
      }
      envelope(t);
      if (working !== nextActive || reduced !== nextReduced) {
        for (const b of bodies) b.from = b.influence;
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
        ball.radius = b.radius * (0.88 + 0.12 * Math.sin(t * 0.31 + b.phase));
        ball.influence = b.influence;
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
