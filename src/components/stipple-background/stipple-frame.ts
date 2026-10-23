import {
  clamp,
  MAX_STIPPLE_METABALLS,
  type StippleMetaball,
} from "./stipple-model";

export type StippleFrame = {
  blobs: Float32Array;
  shapes: Float32Array;
  envelopes: Float32Array;
  colors: Float32Array;
  count: number;
  colorCount: number;
};

const finite = (value: number | undefined, fallback: number) =>
  value !== undefined && Number.isFinite(value) ? value : fallback;

/** Packs caller-owned samples into reusable, bounded GPU uniform buffers. */
export function createCustomStippleFrame() {
  const frame: StippleFrame = {
    blobs: new Float32Array(MAX_STIPPLE_METABALLS * 4),
    shapes: new Float32Array(MAX_STIPPLE_METABALLS * 4),
    envelopes: new Float32Array(MAX_STIPPLE_METABALLS),
    colors: new Float32Array(MAX_STIPPLE_METABALLS * 3),
    count: 0,
    colorCount: 0,
  };
  const colorSlots = new Int32Array(MAX_STIPPLE_METABALLS);
  return {
    sample(
      metaballs: readonly StippleMetaball[],
      aspect: number,
      palette: Float32Array,
    ) {
      frame.count = Math.min(metaballs.length, MAX_STIPPLE_METABALLS);
      frame.colorCount = 0;
      frame.envelopes.fill(0);
      colorSlots.fill(-1);
      const paletteSize = palette.length / 3;
      for (let i = 0; i < frame.count; i++) {
        const ball = metaballs[i];
        if (
          !Number.isFinite(ball.x) ||
          !Number.isFinite(ball.y) ||
          !Number.isFinite(ball.radius) ||
          ball.radius <= 0
        )
          continue;
        const sx = Math.max(0, finite(ball.scale?.[0], 1));
        const sy = Math.max(0, finite(ball.scale?.[1], 1));
        const influence = clamp(finite(ball.influence, 1), 0, 1);
        if (!sx || !sy || !influence) continue;
        const color =
          ((Math.floor(finite(ball.color, i)) % paletteSize) + paletteSize) %
          paletteSize;
        let slot = colorSlots.indexOf(color);
        if (slot === -1) {
          slot = frame.colorCount++;
          colorSlots[slot] = color;
          for (let channel = 0; channel < 3; channel++)
            frame.colors[slot * 3 + channel] = palette[color * 3 + channel];
        }
        // Preserve array identities when an earlier metaball fades to zero.
        const index = i;
        const offset = index * 4;
        frame.blobs[offset] = (ball.x - 0.5) * aspect;
        frame.blobs[offset + 1] = 0.5 - ball.y;
        frame.blobs[offset + 2] = ball.radius * influence;
        frame.blobs[offset + 3] = slot;
        frame.shapes[offset] = sx;
        frame.shapes[offset + 1] = sy;
        frame.shapes[offset + 2] = -finite(ball.rotation, 0);
        frame.shapes[offset + 3] = clamp(finite(ball.wobble, 0), 0, 1);
        frame.envelopes[index] = influence;
      }
      return frame;
    },
  };
}
