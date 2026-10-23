import { describe, expect, it } from "vitest";
import {
  inkSparkleDuration,
  inkSparkleFrame,
  inkSparklePlayback,
} from "./ink-sparkle-model";

const frame = (t: number) => inkSparkleFrame(t, 320, 180, [40, 90], 1337);

describe("Flutter InkSparkle animation port", () => {
  it("retains the 617ms lifetime and original radius curve/hold", () => {
    expect(inkSparkleDuration).toBe(617);
    expect(frame(0).radiusScale).toBe(0);
    expect(frame(0.375).radiusScale).toBeCloseTo(0.77556, 4);
    expect(frame(0.75).radiusScale).toBe(1);
    expect(frame(1).radiusScale).toBe(1);
    expect(frame(0).maxRadius).toBeCloseTo((Math.hypot(320, 180) / 2) * 2.3);
  });
  it("migrates from the contact point to the box center using radius progress", () => {
    expect(frame(0).center).toEqual([40, 90]);
    expect(frame(0.1).center[0]).toBeGreaterThan(40);
    expect(frame(0.375).center).toEqual([160, 90]);
  });
  it("can hold the center outside either side while the radius expands", () => {
    for (const origin of [
      [-8, 11],
      [48, 11],
    ] as const) {
      const early = inkSparkleFrame(0.1, 40, 22, origin, 1337, "fixed");
      const late = inkSparkleFrame(0.7, 40, 22, origin, 1337, "fixed");
      expect(early.center).toEqual(origin);
      expect(late.center).toEqual(origin);
      expect(late.radiusScale).toBeGreaterThan(early.radiusScale);
    }
  });
  it("preserves independent normalized 13/27/60 and 13/27/50 envelopes", () => {
    expect(frame(0).alpha).toBe(0);
    expect(frame(0).sparkleAlpha).toBe(0);
    expect(frame(0.13).alpha).toBe(1);
    expect(frame(13 / 90).sparkleAlpha).toBeCloseTo(1);
    expect(frame(0.4).alpha).toBe(1);
    expect(frame(40 / 90).sparkleAlpha).toBeCloseTo(1);
    expect(frame(0.7).alpha).toBeCloseTo(0.5);
    expect(frame(0.7).sparkleAlpha).toBeCloseTo(0.54);
    expect(frame(1).alpha).toBe(0);
    expect(frame(1).sparkleAlpha).toBe(0);
  });
  it("retains Flutter's logical noise density and phase uniforms", () => {
    expect(frame(0).noiseScale).toEqual([2.1 / 320, 2.1 / 180]);
    expect(frame(0).noisePhase).toBe(1.337);
    expect(frame(0.75).noisePhase).toBe(1.338);
    expect(frame(0).rotation1[0]).toBeCloseTo(
      Math.cos(1337 * Math.PI * 0.0078125 + 1.7 * Math.PI),
    );
    expect(frame(0).circle1[0]).toBeCloseTo(
      0.75 + 1337 * 0.01 * Math.cos(1.5 * 0.55),
    );
  });
});

describe("InkSparkle playback controls", () => {
  it("stretches the same progress timeline to a chosen duration", () => {
    expect(inkSparklePlayback(617 / 4, 617, true).progress).toBe(0.25);
    expect(inkSparklePlayback(500, 2000, true).progress).toBe(0.25);
    expect(inkSparklePlayback(1000, 2000, true).progress).toBe(0.5);
  });
  it("finishes one-shot playback instead of restarting it", () => {
    expect(inkSparklePlayback(500, 2000, false)).toEqual({
      progress: 0.25,
      cycle: 0,
      complete: false,
    });
    expect(inkSparklePlayback(2000, 2000, false)).toEqual({
      progress: 1,
      cycle: 0,
      complete: true,
    });
    expect(inkSparklePlayback(9000, 2000, false)).toEqual({
      progress: 1,
      cycle: 0,
      complete: true,
    });
    expect(inkSparklePlayback(2500, 2000, true)).toEqual({
      progress: 0.25,
      cycle: 1,
      complete: false,
    });
  });
  it("uses the native duration for invalid values and clamps negative elapsed time", () => {
    for (const duration of [0, -1, NaN, Infinity]) {
      expect(inkSparklePlayback(617, duration, false).complete).toBe(true);
    }
    expect(inkSparklePlayback(-1, 2000, false).progress).toBe(0);
  });
});
