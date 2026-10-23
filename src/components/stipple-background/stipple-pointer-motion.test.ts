import { describe, expect, it } from "vitest";
import { withPointerBurst, pointerBaseMotion } from "./stipple-pointer-motion";
import {
  MAX_STIPPLE_METABALLS,
  type StippleMetaball,
  type StippleMotion,
} from "./stipple-model";

const context = () => ({
  width: 800,
  height: 400,
  aspect: 2,
  seed: 42,
  elapsed: 0,
  active: true,
  reducedMotion: false,
  pointer: { x: 0.5, y: 0.5, inside: true, sequence: 1, path: 0 },
});
const empty: StippleMotion = () => [];
const copy = (motion: StippleMotion, ctx: ReturnType<typeof context>) =>
  motion(ctx.elapsed * 0.2, ctx).map((b) => ({ ...b }));

describe("pointer burst composition", () => {
  it("resets a path even if departure and return happen between frames", () => {
    const motion = withPointerBurst(empty),
      ctx = context();
    ctx.pointer.x = 0.1;
    copy(motion, ctx);
    ctx.pointer = { ...ctx.pointer, x: 0.9, path: 1, sequence: 3 };
    ctx.elapsed = 0.24;
    const samples = copy(motion, ctx).filter((b) => b.radius > 0);
    expect(samples.every((b) => b.x < 0.2 || b.x > 0.8)).toBe(true);
  });
  it("keeps transient sample slots stable while an empty base finishes disappearing", () => {
    const ctx = context();
    let base = [{ x: 0.5, y: 0.5, radius: 0.1 }];
    const motion = withPointerBurst(() => base);
    motion(0, ctx);
    ctx.elapsed = 0.1;
    const before = copy(motion, ctx);
    base = [];
    expect(copy(motion, ctx).slice(1)).toEqual(before.slice(1));
    expect(motion(0.1, ctx)[0].influence).toBe(0);
    ctx.elapsed = 1;
    expect(copy(motion, ctx)).toEqual([]);
  });
  it("preserves caller-owned base samples and never changes their array or fields", () => {
    const ball = Object.freeze({ x: 0.2, y: 0.2, radius: 0.2 });
    const base = Object.freeze([ball]);
    const composed = withPointerBurst(() => base);
    const ctx = context();
    const result = composed(0, ctx);
    expect(result[0]).toBe(ball);
    expect(base).toHaveLength(1);
    ctx.elapsed = 0.1;
    expect(composed(0.02, ctx)).toBe(result);
    expect(base).toEqual([ball]);
  });
  it("blooms at the cursor, radiates in different directions and immediately shrinks away", () => {
    const motion = withPointerBurst(empty),
      ctx = context();
    const initial = copy(motion, ctx);
    expect(initial.filter((b) => b.influence === 0)).toHaveLength(
      initial.length,
    );
    ctx.elapsed = 0.08;
    const grown = copy(motion, ctx).filter((b) => b.influence! > 0);
    expect(grown).toHaveLength(3);
    expect(grown.some((b) => b.x < 0.5)).toBe(true);
    expect(grown.some((b) => b.x > 0.5)).toBe(true);
    const distances = grown.map((b) =>
      Math.hypot((b.x - 0.5) * ctx.aspect, b.y - 0.5),
    );
    ctx.elapsed = 0.2;
    const shrinking = copy(motion, ctx).filter((b) => b.influence! > 0);
    shrinking.forEach((b, i) => {
      expect(Math.hypot((b.x - 0.5) * ctx.aspect, b.y - 0.5)).toBeGreaterThan(
        distances[i],
      );
      expect(b.radius * b.influence!).toBeLessThan(
        grown[i].radius * grown[i].influence!,
      );
    });
    ctx.elapsed = 1;
    expect(copy(motion, ctx)).toEqual([]);
    ctx.elapsed = 2;
    expect(copy(motion, ctx)).toEqual([]);
  });
  it("samples movement along the path without drawing a bridge after pointer departure", () => {
    const motion = withPointerBurst(empty),
      ctx = context();
    ctx.pointer.x = 0.1;
    copy(motion, ctx);
    ctx.pointer.x = 0.9;
    ctx.pointer.sequence++;
    ctx.elapsed = 0.24;
    const across = copy(motion, ctx).filter((b) => b.radius > 0);
    expect(across.some((b) => b.x > 0.2 && b.x < 0.8)).toBe(true);
    ctx.pointer.inside = false;
    ctx.pointer.sequence++;
    ctx.elapsed = 1.5;
    expect(copy(motion, ctx)).toEqual([]);
    ctx.pointer = {
      x: 0.1,
      y: 0.1,
      inside: true,
      sequence: ctx.pointer.sequence + 1,
      path: ctx.pointer.path + 1,
    };
    ctx.elapsed = 1.6;
    copy(motion, ctx);
    ctx.elapsed = 1.68;
    expect(
      copy(motion, ctx)
        .filter((b) => b.influence! > 0)
        .every((b) => b.x < 0.2 && b.y < 0.2),
    ).toBe(true);
  });
  it("respects the shared GPU budget and preserves every in-budget base sample", () => {
    const ctx = context();
    const base: StippleMetaball[] = Array.from(
      { length: MAX_STIPPLE_METABALLS - 2 },
      () => ({ x: 0.5, y: 0.5, radius: 0.1 }),
    );
    const motion = withPointerBurst(() => base, { maxParticles: 1000 });
    for (let i = 0; i < 100; i++) {
      ctx.pointer.x = i % 2;
      ctx.pointer.sequence++;
      ctx.elapsed = i / 20;
      const samples = motion(ctx.elapsed, ctx);
      expect(samples.length).toBeLessThanOrEqual(MAX_STIPPLE_METABALLS);
      base.forEach((ball, index) => expect(samples[index]).toBe(ball));
    }
    expect(
      withPointerBurst(() => base, { maxParticles: 0 })(0, context()),
    ).toEqual(base);
  });
  it("uses unscaled time, isolates contexts, and resets on seed or backwards clock changes", () => {
    const motion = withPointerBurst(empty),
      a = context(),
      b = context();
    motion(0, a);
    motion(0, b);
    a.elapsed = 0.1;
    b.elapsed = 0.1;
    expect(copy(motion, a)).toEqual(copy(motion, b));
    b.pointer.x = 0.9;
    b.pointer.sequence++;
    b.elapsed = 0.2;
    copy(motion, b);
    expect(copy(motion, a)).not.toEqual(copy(motion, b));
    a.elapsed = 1;
    expect(motion(0.02, a)).toEqual([]);
    a.seed = 2;
    a.elapsed = 0;
    expect(copy(motion, a).every((b) => b.influence === 0)).toBe(true);
    a.elapsed = 0.1;
    copy(motion, a);
    a.elapsed = 0;
    expect(copy(motion, a).every((b) => b.influence === 0)).toBe(true);
  });
  it("suppresses emissions when inactive, disabled or reduced, and lets existing fields drain", () => {
    const motion = withPointerBurst(empty),
      ctx = context();
    motion(0, ctx);
    ctx.elapsed = 0.1;
    expect(copy(motion, ctx).some((b) => b.influence! > 0)).toBe(true);
    ctx.active = false;
    ctx.pointer.sequence++;
    ctx.elapsed = 0.3;
    expect(copy(motion, ctx).filter((b) => b.influence! > 0)).toHaveLength(3);
    ctx.elapsed = 1;
    expect(copy(motion, ctx)).toEqual([]);
    ctx.active = true;
    ctx.reducedMotion = true;
    ctx.pointer.sequence++;
    expect(copy(motion, ctx)).toEqual([]);
    const missing = { ...ctx, reducedMotion: false, pointer: undefined };
    expect(motion(1, missing)).toEqual([]);
    expect(pointerBaseMotion(withPointerBurst(withPointerBurst(empty)))).toBe(
      empty,
    );
  });
});
