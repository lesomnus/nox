import { describe, expect, it } from "vitest";
import { inkSparkleDuration, inkSparkleFrame } from "./ink-sparkle-model";

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
