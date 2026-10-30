export type ShakePoint = readonly [x: number, y: number];
export type ShakePreset = {
  name: string;
  points: readonly [ShakePoint, ShakePoint, ...ShakePoint[]];
};

/** Normalized, damped paths. Each target picks a path when the effect starts. */
export const SHAKE_PRESETS = [
  {
    name: "rattle",
    points: [
      [0, 0],
      [-1, 0.15],
      [0.85, -0.2],
      [-0.65, 0.1],
      [0.4, -0.1],
      [-0.15, 0.05],
      [0, 0],
    ],
  },
  {
    name: "cross",
    points: [
      [0, 0],
      [0.7, -0.5],
      [-0.85, 0.35],
      [0.6, 0.3],
      [-0.35, -0.2],
      [0.1, 0.1],
      [0, 0],
    ],
  },
  {
    name: "flutter",
    points: [
      [0, 0],
      [-0.4, 0.8],
      [0.65, -0.6],
      [-0.5, 0.35],
      [0.25, -0.3],
      [-0.1, 0.1],
      [0, 0],
    ],
  },
  {
    name: "zigzag",
    points: [
      [0, 0],
      [0.9, 0.35],
      [-0.7, -0.55],
      [0.5, 0.25],
      [-0.3, 0.15],
      [0.15, -0.1],
      [0, 0],
    ],
  },
] as const satisfies readonly ShakePreset[];
