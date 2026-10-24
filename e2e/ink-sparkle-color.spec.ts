import { expect, test } from "@playwright/test";

test.use({
  launchOptions: {
    args: [
      "--no-zygote",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--renderer-process-limit=1",
    ],
  },
});

test.beforeEach(async ({ page }) => {
  const start = new Date("2026-01-01T00:00:00Z");
  await page.clock.install({ time: start });
  await page.clock.pauseAt(new Date(start.getTime() + 60_000));
});

test("sparkle tint and strength change rendered pixels independently of the ink", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=effects-inksparkle--sparkle-colors&viewMode=story",
  );
  const canvases = page.locator("canvas[data-ink-sparkle]");
  await expect(canvases).toHaveCount(4);
  for (const canvas of await canvases.all())
    await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
  await page.clock.runFor(400);
  const result = await canvases.evaluateAll((nodes) => {
    const frames = nodes.map((node) => {
      const canvas = node as HTMLCanvasElement,
        gl = canvas.getContext("webgl2")!;
      const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
      const pixels = new Uint8Array(canvas.width * canvas.height * 4);
      gl.readPixels(
        0,
        0,
        canvas.width,
        canvas.height,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels,
      );
      return {
        pixels,
        tint: Array.from(
          gl.getUniform(
            program,
            gl.getUniformLocation(program, "u_sparkle_color")!,
          ) as Float32Array,
        ),
      };
    });
    const [original, subtle, tinted, hidden] = frames.map(
      (frame) => frame.pixels,
    );
    const metrics = {
      peak: 0,
      wavePeak: 0,
      hiddenRgbPeak: 0,
      sparklePixels: 0,
      inkPixels: 0,
      subtleError: 0,
      subtleAlphaError: 0,
      tintError: 0,
      tintAlphaError: 0,
      defaultChannelError: 0,
    };
    for (let i = 0; i < original.length; i += 4) {
      metrics.peak = Math.max(metrics.peak, original[i]);
      metrics.wavePeak = Math.max(metrics.wavePeak, hidden[i + 3]);
      if (original[i] > 8) metrics.sparklePixels++;
      if (original[i] === 0 && hidden[i + 3] > 0) metrics.inkPixels++;
      metrics.subtleAlphaError = Math.max(
        metrics.subtleAlphaError,
        Math.abs(
          subtle[i + 3] -
            (hidden[i + 3] + 0.2 * (original[i + 3] - hidden[i + 3])),
        ),
      );
      metrics.tintAlphaError = Math.max(
        metrics.tintAlphaError,
        Math.abs(tinted[i + 3] - original[i + 3]),
      );
      for (let channel = 0; channel < 3; channel++) {
        metrics.hiddenRgbPeak = Math.max(
          metrics.hiddenRgbPeak,
          hidden[i + channel],
        );
        metrics.defaultChannelError = Math.max(
          metrics.defaultChannelError,
          Math.abs(original[i + channel] - original[i]),
        );
        metrics.subtleError = Math.max(
          metrics.subtleError,
          Math.abs(subtle[i + channel] - original[i + channel] * 0.2),
        );
        metrics.tintError = Math.max(
          metrics.tintError,
          Math.abs(
            tinted[i + channel] -
              original[i + channel] * [0.25, 0.5, 0.75][channel],
          ),
        );
      }
    }
    return { tints: frames.map((frame) => frame.tint), ...metrics };
  });
  const expected = [
    [1, 1, 1, 1],
    [1, 1, 1, 0.2],
    [0.25, 0.5, 0.75, 1],
    [1, 1, 1, 0],
  ];
  result.tints.forEach((tint, index) =>
    tint.forEach((channel, i) =>
      expect(channel).toBeCloseTo(expected[index][i], 6),
    ),
  );
  expect(result.peak).toBeGreaterThan(8);
  expect(result.sparklePixels).toBeGreaterThan(0);
  expect(result.inkPixels).toBeGreaterThan(0);
  expect(result.wavePeak).toBeGreaterThan(0);
  expect(result.hiddenRgbPeak).toBe(0);
  expect(result.defaultChannelError).toBe(0);
  expect(result.subtleError).toBeLessThanOrEqual(2);
  expect(result.subtleAlphaError).toBeLessThanOrEqual(2);
  expect(result.tintError).toBeLessThanOrEqual(2);
  expect(result.tintAlphaError).toBe(0);
});

test("Button forwards sparkleColor through effectOptions", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=effects-inksparkle--button-tone&viewMode=story",
  );
  const button = page.getByRole("button", { name: "Press to sparkle" });
  await button.focus();
  await page.keyboard.down("Space");
  const canvas = page.locator("canvas[data-ink-sparkle]");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
  const tint = await canvas.evaluate((node) => {
    const gl = (node as HTMLCanvasElement).getContext("webgl2")!;
    const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
    return Array.from(
      gl.getUniform(
        program,
        gl.getUniformLocation(program, "u_sparkle_color")!,
      ) as Float32Array,
    );
  });
  expect(tint.slice(0, 3)).toEqual([1, 1, 1]);
  expect(tint[3]).toBeCloseTo(0.2, 6);
  await page.keyboard.up("Space");
  await page.clock.runFor(1300);
  await expect(canvas).toHaveCount(0);
});
