import { describe, expect, it } from "vitest";
import { workMotion } from "./stipple-work-motion";

const context = (active = true, seed = 42) => ({
  width: 800,
  height: 400,
  aspect: 2,
  seed,
  active,
  reducedMotion: false,
});
const copy = (t: number, ctx: ReturnType<typeof context>) =>
  workMotion(t, ctx).map((b) => ({ ...b, scale: [...b.scale!] }));
function advance(
  ctx: ReturnType<typeof context>,
  from: number,
  to: number,
  fps = 60,
) {
  for (let i = 0; i <= Math.ceil((to - from) * fps); i++)
    workMotion(Math.min(to, from + i / fps), ctx);
  return copy(to, ctx);
}

describe("work motion preset", () => {
  it("starts empty, blooms inside and enters from outside, with reusable samples", () => {
    const ctx = context(false);
    expect(workMotion(0, ctx)).toEqual([]);
    ctx.active = true;
    const first = workMotion(0, ctx);
    expect(first.every((b) => b.influence === 0)).toBe(true);
    expect(first.some((b) => b.x < 0 || b.x > 1 || b.y < 0 || b.y > 1)).toBe(
      true,
    );
    expect(first.some((b) => b.x > 0 && b.x < 1 && b.y > 0 && b.y < 1)).toBe(
      true,
    );
    const initial = copy(0, ctx);
    const growing = advance(ctx, 0, 1);
    expect(growing.every((b) => b.influence! < 0.6)).toBe(true);
    expect(growing.some((b) => b.influence === 0)).toBe(true);
    const grown = advance(ctx, 1, 8);
    expect(workMotion(8, ctx)).toBe(first);
    expect(grown.every((b) => b.influence === 1)).toBe(true);
    const entrants = initial
      .map((b, i) => ({ b, i }))
      .filter(({ b }) => b.x < 0 || b.x > 1 || b.y < 0 || b.y > 1);
    expect(
      entrants.some(
        ({ i }) =>
          grown[i].x > 0 && grown[i].x < 1 && grown[i].y > 0 && grown[i].y < 1,
      ),
    ).toBe(true);
    expect(grown).not.toEqual(initial);
  });
  it("keeps position and size on finish, drifts during staggered shrink, then disappears", () => {
    const ctx = context();
    const before = advance(ctx, 0, 8);
    ctx.active = false;
    expect(copy(8, ctx)).toEqual(before);
    const fading = advance(ctx, 8, 8.25);
    expect(fading.every((b, i) => b.influence! < before[i].influence!)).toBe(
      true,
    );
    expect(new Set(fading.map((b) => b.influence)).size).toBeGreaterThan(1);
    expect(
      fading.some((b, i) => b.x !== before[i].x && b.y !== before[i].y),
    ).toBe(true);
    expect(advance(ctx, 8.25, 10)).toEqual([]);
    expect(workMotion(12, ctx)).toEqual([]);
    ctx.active = true;
    expect(workMotion(12, ctx).every((b) => b.influence === 0)).toBe(true);
    expect(advance(ctx, 12, 20).some((b) => b.influence! > 0.8)).toBe(true);
  });
  it("reverses a partial bloom or fade without popping or resetting velocity", () => {
    const ctx = context();
    const entering = advance(ctx, 0, 0.4);
    ctx.active = false;
    expect(copy(0.4, ctx)).toEqual(entering);
    const leaving = advance(ctx, 0.4, 0.6);
    ctx.active = true;
    expect(copy(0.6, ctx)).toEqual(leaving);
    const continued = advance(ctx, 0.6, 0.7);
    expect(
      continued.every(
        (b, i) =>
          Math.hypot((b.x - leaving[i].x) * ctx.aspect, b.y - leaving[i].y) <
          0.025,
      ),
    ).toBe(true);
    expect(advance(ctx, 0.7, 8).every((b) => b.influence === 1)).toBe(true);
  });
  it("reproduces seeded interacting paths independently of rendering cadence or other instances", () => {
    const a = context(),
      b = context();
    const slow = advance(a, 0, 75, 10);
    const fast = advance(b, 0, 75, 60);
    slow.forEach((ball, i) => {
      expect(ball.x).toBeCloseTo(fast[i].x, 10);
      expect(ball.y).toBeCloseTo(fast[i].y, 10);
    });
    expect(advance(context(true, 43), 0, 75)).not.toEqual(fast);
    expect(copy(75, b)).toEqual(fast);
  });
  it("shrinks individual fields to zero while still moving, then blooms new fields without visible jumps", () => {
    const ctx = context();
    let previous = copy(0, ctx);
    const stages = previous.map(() => ({
      grown: false,
      gone: false,
      reborn: false,
    }));
    let movingWhileShrinking = false;
    for (let step = 1; step <= 1800; step++) {
      const balls = copy(step / 20, ctx);
      balls.forEach((ball, i) => {
        const old = previous[i],
          stage = stages[i];
        const influence = ball.influence!;
        if (influence > 0.9) stage.grown = true;
        if (stage.grown && influence === 0) stage.gone = true;
        if (stage.gone && influence > 0.1) stage.reborn = true;
        if (influence > 0 && influence < old.influence! && ball.x !== old.x)
          movingWhileShrinking = true;
        const distance = Math.hypot(
          (ball.x - old.x) * ctx.aspect,
          ball.y - old.y,
        );
        if (distance > 0.02) {
          expect(old.influence).toBe(0);
          expect(influence).toBe(0);
        }
        expect(
          Math.abs(ball.radius * influence - old.radius * old.influence!),
        ).toBeLessThan(0.02);
      });
      expect(balls.some((b) => b.influence! > 0.2) || step < 120).toBe(true);
      previous = balls;
    }
    expect(movingWhileShrinking).toBe(true);
    expect(stages.every((s) => s.gone && s.reborn)).toBe(true);
    expect(ctx.active).toBe(true);
  });
  it("freezes individual lifetimes on finish and resumes a partial exit without respawning or popping", () => {
    const ctx = context();
    let t = 8;
    let before = advance(ctx, 0, t);
    while (
      t < 28 &&
      !before.some((b) => b.influence! > 0.1 && b.influence! < 0.8)
    ) {
      t += 0.1;
      before = copy(t, ctx);
    }
    expect(before.some((b) => b.influence! > 0.1 && b.influence! < 0.8)).toBe(
      true,
    );
    ctx.active = false;
    expect(copy(t, ctx)).toEqual(before);
    const exiting = advance(ctx, t, t + 0.4);
    expect(exiting.every((b, i) => b.influence! <= before[i].influence!)).toBe(
      true,
    );
    ctx.active = true;
    expect(copy(t + 0.4, ctx)).toEqual(exiting);
    ctx.active = false;
    expect(copy(t + 0.4, ctx)).toEqual(exiting);
    expect(advance(ctx, t + 0.4, t + 2)).toEqual([]);
    expect(copy(t + 100, ctx)).toEqual([]);
  });
  it("keeps clearly different sizes and independent breathing rather than synchronized pulses", () => {
    for (const seed of [1, 42, 140]) {
      const ctx = context(true, seed);
      const first = advance(ctx, 0, 8);
      const sizes = first.map((b) => b.radius);
      expect(Math.max(...sizes) / Math.min(...sizes)).toBeGreaterThan(3);
      const later = advance(ctx, 8, 20);
      const changes = later.map((b, i) => b.radius / first[i].radius);
      expect(Math.max(...changes) - Math.min(...changes)).toBeGreaterThan(0.4);
    }
  });
  it("roams across the viewport instead of converging into one central group", () => {
    for (const seed of [1, 42, 140]) {
      const ctx = context(true, seed);
      advance(ctx, 0, 40, 10);
      let spread = 0,
        crowded = 0,
        pairs = 0,
        frames = 0;
      for (let t = 40; t <= 100; t += 2) {
        const balls = advance(ctx, Math.max(40, t - 2), t, 10);
        const cx = balls.reduce((sum, b) => sum + b.x, 0) / balls.length;
        const cy = balls.reduce((sum, b) => sum + b.y, 0) / balls.length;
        for (let i = 0; i < balls.length; i++) {
          const b = balls[i];
          spread += ((b.x - cx) * ctx.aspect) ** 2 + (b.y - cy) ** 2;
          for (let j = i + 1; j < balls.length; j++) {
            const other = balls[j];
            crowded += Number(
              Math.hypot((b.x - other.x) * ctx.aspect, b.y - other.y) < 0.22,
            );
            pairs++;
          }
        }
        frames++;
      }
      expect(Math.sqrt(spread / frames / 10)).toBeGreaterThan(0.4);
      expect(crowded / pairs).toBeLessThan(0.075);
    }
  });
  it("keeps long-running forces finite and contained, including narrow viewports and large time skips", () => {
    for (const aspect of [0.3, 1, 4]) {
      const ctx = { ...context(), aspect };
      const initial = copy(0, ctx);
      const drifted = advance(ctx, 0, 80, 10);
      drifted.forEach((b, i) => {
        expect([b.x, b.y, b.radius, b.rotation].every(Number.isFinite)).toBe(
          true,
        );
        expect(b.x).toBeGreaterThan(-0.5);
        expect(b.x).toBeLessThan(1.5);
        expect(b.y).toBeGreaterThan(-0.2);
        expect(b.y).toBeLessThan(1.2);
        expect(b.x).not.toBe(initial[i].x);
      });
      expect(
        copy(1e9, ctx).every(
          (b) => Number.isFinite(b.x) && Number.isFinite(b.y),
        ),
      ).toBe(true);
      expect(
        copy(1e30, ctx).every(
          (b) => Number.isFinite(b.x) && Number.isFinite(b.y),
        ),
      ).toBe(true);
    }
  });
  it("preserves fractional positions on resize and resets on seed change or backwards seeking", () => {
    const ctx = context();
    const before = advance(ctx, 0, 2);
    ctx.aspect = 1;
    const resized = copy(2, ctx);
    resized.forEach((b, i) => expect(b.x).toBeCloseTo(before[i].x, 10));
    ctx.seed = 43;
    expect(copy(2, ctx)).toEqual(copy(2, { ...context(true, 43), aspect: 1 }));
    expect(copy(0, ctx)).toEqual(copy(0, { ...context(true, 43), aspect: 1 }));
  });
  it("shows a static active composition under reduced motion and hides immediately when finished", () => {
    const ctx = { ...context(), reducedMotion: true };
    expect(
      copy(0, ctx).every(
        (b) => b.influence === 1 && b.x > 0 && b.x < 1 && b.y > 0 && b.y < 1,
      ),
    ).toBe(true);
    ctx.active = false;
    expect(workMotion(0, ctx)).toEqual([]);
    ctx.active = true;
    expect(copy(0, ctx).every((b) => b.influence === 1)).toBe(true);
  });
});
