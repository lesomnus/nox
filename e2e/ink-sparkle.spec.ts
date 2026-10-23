import { expect, test, type Locator } from "@playwright/test";

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

const uniforms = (canvas: Locator) =>
  canvas.evaluate((node) => {
    const gl = (node as HTMLCanvasElement).getContext("webgl2")!;
    const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
    return {
      composite: Array.from(
        gl.getUniform(
          program,
          gl.getUniformLocation(program, "u_composite_1")!,
        ) as Float32Array,
      ),
      center: Array.from(
        gl.getUniform(
          program,
          gl.getUniformLocation(program, "u_center")!,
        ) as Float32Array,
      ),
    };
  });

test("public effect duration changes actual GPU progress at the same elapsed time", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto(
    "/iframe.html?id=effects-inksparkle--speed-comparison&viewMode=story",
  );
  await page.clock.pauseAt(
    new Date(await page.evaluate(() => Date.now() + 100)),
  );
  await page.getByRole("button", { name: "Restart both" }).click();
  const canvases = page.locator("canvas[data-ink-sparkle]");
  await expect(canvases).toHaveCount(2);
  for (const canvas of await canvases.all())
    await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
  await page.clock.runFor(200);
  const native = await uniforms(canvases.nth(0));
  const slow = await uniforms(canvases.nth(1));
  expect(native.composite[3]).toBeGreaterThan(0.5);
  expect(slow.composite[3]).toBeLessThan(0.1);
  expect(native.composite[3]).toBeGreaterThan(slow.composite[3]);
});

test("an outside fixed origin remains outside as the ripple expands", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto(
    "/iframe.html?id=effects-inksparkle--outside-center&viewMode=story",
  );
  const canvas = page.locator("canvas[data-ink-sparkle]");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
  await page.clock.pauseAt(
    new Date(await page.evaluate(() => Date.now() + 100)),
  );
  expect((await uniforms(canvas)).center).toEqual([-24, 90]);
  await page.clock.runFor(400);
  expect((await uniforms(canvas)).center).toEqual([-24, 90]);
});

test("one-shot playback finishes once and stays finished", async ({ page }) => {
  await page.clock.install();
  await page.goto(
    "/iframe.html?id=effects-inksparkle--single-burst&viewMode=story",
  );
  await page.clock.pauseAt(
    new Date(await page.evaluate(() => Date.now() + 100)),
  );
  await page.getByRole("button", { name: "Replay" }).click();
  const canvas = page.locator("canvas[data-ink-sparkle]");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
  await expect(page.getByLabel("Completed bursts")).toHaveText("0");
  await page.clock.runFor(2100);
  await expect(page.getByLabel("Completed bursts")).toHaveText("1");
  expect((await uniforms(canvas)).composite).toEqual([0, 0, 1, 1]);
  await page.clock.runFor(2200);
  await expect(page.getByLabel("Completed bursts")).toHaveText("1");
});
