import { describe, expect, it } from "vitest";
import { createCustomStippleFrame } from "./stipple-frame";
import { MAX_STIPPLE_METABALLS, resolveStippleSettings } from "./stipple-model";

const palette = resolveStippleSettings({ palette: ["#f00", "#00f"] }).palette;

describe("custom stipple samples", () => {
  it("converts viewport coordinates and clockwise ellipse rotation to shader space", () => {
    const sampler = createCustomStippleFrame();
    const frame = sampler.sample(
      [
        {
          x: 0.75,
          y: 0.25,
          radius: 0.2,
          scale: [2, 0.5],
          rotation: Math.PI / 2,
          wobble: 0.3,
          deformation: 0.8,
          color: 1,
        },
      ],
      2,
      palette,
    );
    expect(frame.count).toBe(1);
    expect([...frame.blobs.slice(0, 2)]).toEqual([0.5, 0.25]);
    expect(frame.blobs[2]).toBeCloseTo(0.2);
    expect([...frame.shapes.slice(0, 2)]).toEqual([2, 0.5]);
    expect(frame.shapes[2]).toBeCloseTo(-Math.PI / 2);
    expect(frame.shapes[3]).toBeCloseTo(0.3);
    expect(frame.deformations[0]).toBeCloseTo(0.8);
    expect([...frame.colors.slice(0, 3)]).toEqual([0, 0, 1]);
  });
  it("groups the same palette color and reuses buffers across samples and empty frames", () => {
    const sampler = createCustomStippleFrame();
    const balls = [0, 1, 2].map((color) => ({
      x: 0.5,
      y: 0.5,
      radius: 0.2,
      color,
    }));
    const frame = sampler.sample(balls, 1, palette);
    const { blobs, colors, shapes, envelopes, deformations } = frame;
    expect(frame.colorCount).toBe(2);
    expect([blobs[3], blobs[7], blobs[11]]).toEqual([0, 1, 0]);
    expect(sampler.sample([], 1, palette)).toBe(frame);
    expect(frame.count).toBe(0);
    expect(frame.colorCount).toBe(0);
    sampler.sample(balls.slice(0, 1), 1, palette);
    expect(frame.count).toBe(1);
    expect(frame.blobs).toBe(blobs);
    expect(frame.colors).toBe(colors);
    expect(frame.shapes).toBe(shapes);
    expect(frame.envelopes).toBe(envelopes);
    expect(frame.deformations).toBe(deformations);
  });
  it("keeps liquid deformation opt-in, clamps it and clears a prior value on reuse", () => {
    const sampler = createCustomStippleFrame();
    const ball = { x: 0.5, y: 0.5, radius: 0.2 };
    const frame = sampler.sample(
      [
        { ...ball, deformation: 2 },
        { ...ball, deformation: -1 },
        { ...ball, deformation: NaN },
      ],
      1,
      palette,
    );
    expect([...frame.deformations.slice(0, 3)]).toEqual([1, 0, 0]);
    sampler.sample([ball], 1, palette);
    expect(frame.deformations[0]).toBe(0);
  });
  it("bounds the GPU workload and excludes invalid or invisible samples", () => {
    const sampler = createCustomStippleFrame();
    const ball = { x: 0.5, y: 0.5, radius: 0.2 };
    expect(
      sampler.sample(Array(MAX_STIPPLE_METABALLS + 10).fill(ball), 1, palette)
        .count,
    ).toBe(MAX_STIPPLE_METABALLS);
    const frame = sampler.sample(
      [
        { ...ball, x: NaN },
        { ...ball, radius: -1 },
        { ...ball, scale: [0, 1] },
        { ...ball, influence: 0 },
        { ...ball, influence: 0.5 },
      ],
      1,
      palette,
    );
    expect([...frame.envelopes].filter((value) => value > 0)).toEqual([0.5]);
    expect(frame.blobs[4 * 4 + 2]).toBeCloseTo(0.1);
    expect([...frame.shapes.slice(4 * 4, 4 * 4 + 2)]).toEqual([1, 1]);
  });
  it("retains later metaball identities when an earlier sample becomes invisible", () => {
    const sampler = createCustomStippleFrame();
    const ball = { x: 0.5, y: 0.5, radius: 0.2 };
    const frame = sampler.sample(
      [ball, { ...ball, x: 0.8, wobble: 1 }],
      1,
      palette,
    );
    const position = [...frame.blobs.slice(4, 7)];
    sampler.sample(
      [
        { ...ball, influence: 0 },
        { ...ball, x: 0.8, wobble: 1 },
      ],
      1,
      palette,
    );
    expect(frame.envelopes[0]).toBe(0);
    expect(frame.envelopes[1]).toBe(1);
    expect([...frame.blobs.slice(4, 7)]).toEqual(position);
    expect(frame.shapes[7]).toBe(1);
  });
});
