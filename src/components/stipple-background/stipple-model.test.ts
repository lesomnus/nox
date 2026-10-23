import { describe, expect, it } from "vitest";
import {
  BLOB_COUNT,
  CLUSTER_COUNT,
  clusterEnvelope,
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
  it("keeps long-running pairs finite and sharing a palette slot", () => {
    const motion = createStippleMotion(42);
    for (const time of [0, 0.1, 39, 68, 100, 10000, 10001]) {
      const blobs = motion.sample(time, 0.4);
      expect([...blobs].every(Number.isFinite)).toBe(true);
      for (let i = 0; i < BLOB_COUNT; i += 2) {
        expect(blobs[i * 4 + 2]).toBeGreaterThanOrEqual(0);
        expect(blobs[(i + 1) * 4 + 2]).toBeGreaterThanOrEqual(0);
        expect(blobs[i * 4 + 3]).toBeGreaterThanOrEqual(0);
        expect(blobs[i * 4 + 3]).toBeLessThan(CLUSTER_COUNT);
        expect(blobs[(i + 1) * 4 + 3]).toBe(blobs[i * 4 + 3]);
      }
    }
  });
  it("grows from nothing and fades completely before a new lifetime", () => {
    [0, 0.09, 0.18, 0.5, 0.68, 0.84, 1].forEach((progress, i) => {
      expect(clusterEnvelope(progress)).toBeCloseTo(
        [0, 0.5, 1, 1, 1, 0.5, 0][i],
      );
    });
    const motion = createStippleMotion(1);
    const blobs = motion.sample(1000, 1.5);
    expect([...motion.envelopes]).toEqual(Array(BLOB_COUNT).fill(0));
    for (let i = 0; i < BLOB_COUNT; i++) expect(blobs[i * 4 + 2]).toBe(0);
    motion.sample(1010, 1.5);
    expect([...motion.envelopes].every((n) => n > 0 && n <= 1)).toBe(true);
    for (let i = 0; i < BLOB_COUNT; i++)
      expect(blobs[i * 4 + 2]).toBeGreaterThan(0);
  });
  it("keeps interior cluster centers in the viewport while growing and shrinking", () => {
    for (const aspect of [0.3, 1, 3]) {
      const motion = createStippleMotion(1);
      for (const time of [1000, 1002, 1010, 1030, 1039]) {
        const blobs = motion.sample(time, aspect);
        for (let cluster = 0; cluster < CLUSTER_COUNT; cluster += 2) {
          const offset = cluster * 8;
          const x = (blobs[offset] + blobs[offset + 4]) / 2;
          const y = (blobs[offset + 1] + blobs[offset + 5]) / 2;
          expect(Math.abs(x)).toBeLessThan(aspect / 2);
          expect(Math.abs(y)).toBeLessThan(0.5);
        }
      }
    }
  });
  it("samples variable palettes without replacing buffers or restarting motion", () => {
    const motion = createStippleMotion(1);
    const palette = resolveStippleSettings({
      palette: ["#f00", "#0f0", "#00f", "#ff0"],
    }).palette;
    const blobs = motion.sample(5, 1.5, palette);
    const positions = [...blobs];
    const colors = motion.colors;
    const envelopes = motion.envelopes;
    expect([...colors.slice(0, 12)]).toEqual([...palette]);
    const mono = resolveStippleSettings({ palette: ["#aaa"] }).palette;
    expect(motion.sample(5, 1.5, mono)).toBe(blobs);
    expect(motion.colors).toBe(colors);
    expect(motion.envelopes).toBe(envelopes);
    for (let i = 0; i < BLOB_COUNT; i++) {
      expect([...blobs.slice(i * 4, i * 4 + 3)]).toEqual(
        positions.slice(i * 4, i * 4 + 3),
      );
      expect(blobs[i * 4 + 3]).toBe(0);
    }
    expect([...colors.slice(0, 3)]).toEqual([...mono]);
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
  it("accepts one or many palette colors, retains colors shorthand and falls back on empty input", () => {
    const palette = ["#f00", "#0f0", "#00f", "#ff0"] as const;
    expect(resolveStippleSettings({ palette }).palette).toHaveLength(12);
    expect(
      resolveStippleSettings({
        palette: ["#f00"],
        colors: ["#fff", "#fff", "#fff"],
      }).palette,
    ).toEqual(new Float32Array([1, 0, 0]));
    expect(
      resolveStippleSettings({ colors: ["#f00", "#0f0", "#00f"] }).palette,
    ).toEqual(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]));
    expect(
      resolveStippleSettings({ palette: ["#invalid", "#0f0"] }).palette,
    ).toEqual(new Float32Array([0, 1, 0]));
    expect(resolveStippleSettings({ palette: [] }).palette).toEqual(
      resolveStippleSettings({}).palette,
    );
    expect(resolveStippleSettings({ palette: ["#invalid"] }).palette).toEqual(
      resolveStippleSettings({}).palette,
    );
  });
});
