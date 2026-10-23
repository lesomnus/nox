import { describe, expect, it } from "vitest";
import { clusterEnvelope, clusterMotion } from "./stipple-motions";
import type { StippleMotionContext } from "./stipple-model";

const context = (seed = 1, aspect = 1.5): StippleMotionContext => ({
  seed,
  aspect,
  width: aspect * 400,
  height: 400,
});
const snapshot = (t: number, ctx = context()) =>
  clusterMotion(t, ctx).map((ball) => ({ ...ball }));

describe("cluster motion preset", () => {
  it("reproduces seeded motion and reuses each context's sample array", () => {
    const ctx = context();
    const samples = clusterMotion(0, ctx);
    const initial = snapshot(0);
    expect(samples.length).toBeGreaterThan(0);
    for (const t of [0, 1, 20, 70, 120, 10000]) {
      expect(clusterMotion(t, ctx)).toBe(samples);
      expect(snapshot(t, ctx)).toEqual(snapshot(t));
    }
    expect(snapshot(0, context(2))).not.toEqual(initial);
  });
  it("depends on time and seed rather than sampling order or frame cadence", () => {
    const ctx = context();
    for (let t = 0; t < 130; t += 0.5) clusterMotion(t, ctx);
    for (const t of [130, 70, 0, 1000000000, 1, 69]) {
      expect(snapshot(t, ctx)).toEqual(snapshot(t));
    }
  });
  it("isolates independent contexts and handles seed and viewport changes", () => {
    const first = context(),
      second = context(2);
    const other = snapshot(10, second);
    const a = clusterMotion(0, first),
      b = clusterMotion(0, second);
    expect(a).not.toBe(b);
    clusterMotion(100, first);
    expect(snapshot(10, second)).toEqual(other);
    const changing = { ...first };
    clusterMotion(10, changing);
    changing.seed = 2;
    changing.aspect = 0.4;
    expect(snapshot(10, changing)).toEqual(snapshot(10, context(2, 0.4)));
  });
  it("keeps paired colors, finite fields and interior centers inside any aspect", () => {
    for (const aspect of [0.3, 1, 3]) {
      const ctx = context(42, aspect);
      for (const t of [0, 39, 68, 100, 10000]) {
        const balls = clusterMotion(t, ctx);
        for (let i = 0; i < balls.length; i += 2) {
          const a = balls[i],
            b = balls[i + 1];
          expect(
            [a.x, a.y, a.radius, b.x, b.y, b.radius].every(Number.isFinite),
          ).toBe(true);
          expect(a.radius).toBeGreaterThan(0);
          expect(a.influence).toBeGreaterThanOrEqual(0);
          expect(a.influence).toBeLessThanOrEqual(1);
          expect(a.color).toBe(b.color);
          if (i % 4 === 0) {
            expect((a.x + b.x) / 2).toBeGreaterThan(0);
            expect((a.x + b.x) / 2).toBeLessThan(1);
            expect((a.y + b.y) / 2).toBeGreaterThan(0);
            expect((a.y + b.y) / 2).toBeLessThan(1);
          }
        }
      }
    }
  });
  it("grows from zero influence and fades fully with smooth endpoints", () => {
    [0, 0.09, 0.18, 0.5, 0.68, 0.84, 1].forEach((progress, i) => {
      expect(clusterEnvelope(progress)).toBeCloseTo(
        [0, 0.5, 1, 1, 1, 0.5, 0][i],
      );
    });
  });
});
