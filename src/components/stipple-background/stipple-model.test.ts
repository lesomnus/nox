import { describe, expect, it } from "vitest";
import { hexColor, rasterSize, resolveStippleSettings } from "./stipple-model";

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
  it("keeps edge fading opt-in and bounds its strength", () => {
    expect(resolveStippleSettings({}).edgeFade).toBe(0);
    expect(resolveStippleSettings({ edgeFade: 0.6 }).edgeFade).toBe(0.6);
    expect(resolveStippleSettings({ edgeFade: -1 }).edgeFade).toBe(0);
    expect(resolveStippleSettings({ edgeFade: 2 }).edgeFade).toBe(1);
    expect(resolveStippleSettings({ edgeFade: NaN }).edgeFade).toBe(0);
  });
  it("defaults to one additional fade shade and normalizes the count", () => {
    expect(resolveStippleSettings({}).edgeFadeSteps).toBe(1);
    expect(resolveStippleSettings({ edgeFadeSteps: 0 }).edgeFadeSteps).toBe(0);
    expect(resolveStippleSettings({ edgeFadeSteps: 3.9 }).edgeFadeSteps).toBe(
      3,
    );
    expect(resolveStippleSettings({ edgeFadeSteps: -5 }).edgeFadeSteps).toBe(0);
    expect(resolveStippleSettings({ edgeFadeSteps: NaN }).edgeFadeSteps).toBe(
      1,
    );
    expect(
      resolveStippleSettings({ edgeFadeSteps: Infinity }).edgeFadeSteps,
    ).toBe(1);
  });
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
