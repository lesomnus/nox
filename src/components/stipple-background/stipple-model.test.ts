import { describe, expect, it } from "vitest";
import {
  BLOB_COUNT,
  createStippleMotion,
  hexColor,
  rasterSize,
  resolveStippleSettings,
} from "./stipple-model";

describe("stipple motion", () => {
  it("reproduces the same seeded motion and reuses its uniform buffer", () => {
    const left = createStippleMotion(1),
      right = createStippleMotion(1);
    const initial = left.sample(0, 1.5);
    const initialValues = [...initial];
    expect(initial).toHaveLength(BLOB_COUNT * 4);
    for (const time of [0, 1, 20, 70, 120]) {
      expect(left.sample(time, 1.5)).toBe(initial);
      expect([...left.sample(time, 1.5)]).toEqual([...right.sample(time, 1.5)]);
    }
    expect([...initial]).not.toEqual(initialValues);
    expect([...createStippleMotion(2).sample(0, 1.5)]).not.toEqual(
      initialValues,
    );
  });
  it("keeps long-running pairs finite, positive and in their color groups", () => {
    const motion = createStippleMotion(42);
    for (const time of [0, 0.1, 39, 68, 100, 10000, 10001]) {
      const blobs = motion.sample(time, 0.4);
      expect([...blobs].every(Number.isFinite)).toBe(true);
      for (let i = 0; i < BLOB_COUNT; i += 2) {
        expect(blobs[i * 4 + 2]).toBeGreaterThan(0);
        expect(blobs[(i + 1) * 4 + 2]).toBeGreaterThan(0);
        expect(blobs[i * 4 + 3]).toBe((i / 2) % 3);
        expect(blobs[(i + 1) * 4 + 3]).toBe(blobs[i * 4 + 3]);
      }
    }
  });
});

describe("raster budget", () => {
  it("caps wide and high-DPI surfaces without changing their aspect ratio", () => {
    const size = rasterSize(12000, 6000, 3, 1200, 4096);
    expect(size.width).toBe(1200);
    expect(size.height).toBe(600);
    expect(size.scale).toBe(0.1);
    expect(rasterSize(100, 80, 4, 1200, 4096)).toEqual({
      width: 200,
      height: 160,
      scale: 2,
    });
  });
  it("also respects the GPU limit for narrow, very tall surfaces", () => {
    const size = rasterSize(100, 40000, 2, 1200, 4096);
    expect(size.height).toBeLessThanOrEqual(4096);
    expect(size.width).toBeGreaterThan(0);
    expect(rasterSize(0, 0, 2, 1200, 4096)).toEqual({
      width: 1,
      height: 1,
      scale: 2,
    });
  });
});

describe("settings", () => {
  it("resolves hex palettes and protects uniforms from invalid numeric values", () => {
    expect(hexColor("#aBc")).toEqual([170 / 255, 187 / 255, 204 / 255]);
    expect(hexColor("#aabbcc")).toEqual(hexColor("#abc"));
    expect(hexColor("invalid")).toBeUndefined();
    const fallback = resolveStippleSettings({});
    const invalid = resolveStippleSettings({
      speed: NaN,
      grainPx: Infinity,
      scatterPx: NaN,
      merge: Infinity,
      maxWidth: NaN,
      maxFps: Infinity,
      backgroundColor: "#invalid",
    });
    expect(invalid).toEqual(fallback);
    expect(
      resolveStippleSettings({ speed: 0, merge: 0, paused: true }),
    ).toMatchObject({ speed: 0, merge: 0, paused: true });
  });
});
