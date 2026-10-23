// Copyright 2014 The Flutter Authors. All rights reserved.
// Ported from Flutter ink_sparkle.dart. BSD-3-Clause: docs/flutter-LICENSE.txt.

export const inkSparkleDuration = 617;
export type InkSparkleCenterMotion = "to-center" | "fixed";

export function inkSparklePlayback(
  elapsed: number,
  duration: number,
  loop: boolean,
) {
  const lifetime =
    Number.isFinite(duration) && duration > 0 ? duration : inkSparkleDuration;
  const time = Math.max(0, elapsed);
  return {
    progress: loop
      ? (time % lifetime) / lifetime
      : Math.min(1, time / lifetime),
    cycle: loop ? Math.floor(time / lifetime) : 0,
    complete: !loop && time >= lifetime,
  };
}

// Flutter Curves.fastOutSlowIn: Cubic(0.4, 0.0, 0.2, 1.0).
function fastOutSlowIn(t: number) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  let lower = 0;
  let upper = 1;
  for (let i = 0; i < 24; i++) {
    const s = (lower + upper) / 2;
    const x = 3 * (1 - s) ** 2 * s * 0.4 + 3 * (1 - s) * s * s * 0.2 + s ** 3;
    if (x < t) lower = s;
    else upper = s;
  }
  const s = (lower + upper) / 2;
  return 3 * (1 - s) * s * s + s ** 3;
}

function envelope(t: number, total: number, fade: number) {
  const weight = t * total;
  if (weight < 13) return weight / 13;
  if (weight < 40) return 1;
  return Math.max(0, 1 - (weight - 40) / fade);
}

export function inkSparkleFrame(
  progress: number,
  width: number,
  height: number,
  origin: readonly [number, number],
  seed: number,
  centerMotion: InkSparkleCenterMotion = "to-center",
) {
  const t = Math.max(0, Math.min(1, progress));
  const radiusScale = fastOutSlowIn(Math.min(1, t / 0.75));
  const centerProgress =
    centerMotion === "fixed" ? 0 : Math.min(1, radiusScale * 2);
  const phase = seed + radiusScale;
  const turbulenceScale = 1.5;
  const rotateRight = Math.PI * 0.0078125;
  const rotation = (angle: number) =>
    [Math.cos(angle), Math.sin(angle)] as const;
  return {
    radiusScale,
    alpha: envelope(t, 100, 60),
    sparkleAlpha: envelope(t, 90, 50),
    center: [
      origin[0] + (width / 2 - origin[0]) * centerProgress,
      origin[1] + (height / 2 - origin[1]) * centerProgress,
    ] as const,
    maxRadius: (Math.hypot(width, height) / 2) * 2.3,
    resolutionScale: [1 / width, 1 / height] as const,
    noiseScale: [2.1 / width, 2.1 / height] as const,
    noisePhase: phase / 1000,
    circle1: [
      turbulenceScale * 0.5 + phase * 0.01 * Math.cos(turbulenceScale * 0.55),
      turbulenceScale * 0.5 + phase * 0.01 * Math.sin(turbulenceScale * 0.55),
    ] as const,
    circle2: [
      turbulenceScale * 0.2 +
        phase * -0.0066 * Math.cos(turbulenceScale * 0.45),
      turbulenceScale * 0.2 +
        phase * -0.0066 * Math.sin(turbulenceScale * 0.45),
    ] as const,
    circle3: [
      turbulenceScale + phase * -0.0066 * Math.cos(turbulenceScale * 0.35),
      turbulenceScale + phase * -0.0066 * Math.sin(turbulenceScale * 0.35),
    ] as const,
    rotation1: rotation(phase * rotateRight + 1.7 * Math.PI),
    rotation2: rotation(phase * -rotateRight + 2 * Math.PI),
    rotation3: rotation(phase * rotateRight + 2.75 * Math.PI),
  };
}
