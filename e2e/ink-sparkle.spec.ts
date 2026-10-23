import { expect, test, type Locator, type Page } from "@playwright/test";

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

async function pauseClock(page: Page) {
  const start = new Date("2026-01-01T00:00:00Z");
  await page.clock.install({ time: start });
  await page.clock.pauseAt(new Date(start.getTime() + 60_000));
}

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

test("button ink starts on press, holds without drawing and fades on release outside the button", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const metrics = { draws: 0, programs: 0 };
    Object.defineProperty(window, "inkPressMetrics", { value: metrics });
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      metrics.draws++;
      return draw.apply(this, args);
    };
    const create = WebGL2RenderingContext.prototype.createProgram;
    WebGL2RenderingContext.prototype.createProgram = function () {
      metrics.programs++;
      return create.call(this);
    };
  });
  await pauseClock(page);
  await page.goto(
    "/iframe.html?id=effects-inksparkle--button-click&viewMode=story",
  );
  const button = page.getByRole("button", { name: "Press to sparkle" });
  const box = (await button.boundingBox())!;
  const canvas = page.locator("canvas[data-ink-sparkle]");
  await page.mouse.move(box.x + 18, box.y + box.height / 2);
  await page.mouse.down();
  await expect(canvas).toHaveAttribute("data-pressed", "true");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
  expect((await uniforms(canvas)).center).toEqual([18, box.height / 2]);
  await page.clock.runFor(600);
  const held = await uniforms(canvas);
  expect(held.composite[0]).toBe(1);
  expect(held.composite[3]).toBeGreaterThan(0.7);
  const metrics = () =>
    page.evaluate(
      () =>
        (
          window as unknown as {
            inkPressMetrics: { draws: number; programs: number };
          }
        ).inkPressMetrics,
    );
  const settled = await metrics();
  await page.clock.runFor(2400);
  expect(await uniforms(canvas)).toEqual(held);
  expect(await metrics()).toEqual(settled);
  await page.mouse.move(box.x - 40, box.y - 40);
  await page.mouse.up();
  await expect(canvas).toHaveAttribute("data-pressed", "false");
  expect(await uniforms(canvas)).toEqual(held);
  expect((await metrics()).programs).toBe(settled.programs);
  expect(
    await canvas.evaluate((el) => getComputedStyle(el).transitionProperty),
  ).toBe("opacity");
  await page.clock.runFor(200);
  await expect(canvas).toHaveCount(0);
});

test("button ink releases early with keys, blur and cancellation, and respects reduced motion", async ({
  page,
}) => {
  await pauseClock(page);
  await page.goto(
    "/iframe.html?id=effects-inksparkle--button-click&viewMode=story",
  );
  const button = page.getByRole("button", { name: "Press to sparkle" });
  const canvas = page.locator("canvas[data-ink-sparkle]");
  await button.focus();
  await page.keyboard.down("Enter");
  await expect(canvas).toHaveCount(1);
  const box = (await button.boundingBox())!;
  expect((await uniforms(canvas)).center).toEqual([
    box.width / 2,
    box.height / 2,
  ]);
  await page.clock.runFor(90);
  const early = await uniforms(canvas);
  await page.keyboard.up("Enter");
  await expect(canvas).toHaveAttribute("data-pressed", "false");
  expect(await uniforms(canvas)).toEqual(early);
  await page.clock.runFor(200);
  await expect(canvas).toHaveCount(0);
  await page.keyboard.down("Space");
  await page.keyboard.down("Space");
  await expect(canvas).toHaveCount(1);
  await button.evaluate((el) => el.blur());
  await page.clock.runFor(200);
  await expect(canvas).toHaveCount(0);
  await page.keyboard.up("Space");
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await expect(canvas).toHaveCount(1);
  await button.dispatchEvent("pointercancel", { pointerId: 1 });
  await page.clock.runFor(200);
  await expect(canvas).toHaveCount(0);
  await page.mouse.up();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await button.focus();
  await page.keyboard.down("Enter");
  await expect(canvas).toHaveAttribute("data-pressed", "true");
  await page.clock.runFor(1800);
  await expect(canvas).toHaveCount(1);
  await page.keyboard.up("Enter");
  await expect(canvas).toHaveCount(0);
});

test("public effect duration changes actual GPU progress at the same elapsed time", async ({
  page,
}) => {
  await pauseClock(page);
  await page.goto(
    "/iframe.html?id=effects-inksparkle--speed-comparison&viewMode=story",
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
  await pauseClock(page);
  await page.goto(
    "/iframe.html?id=effects-inksparkle--outside-center&viewMode=story",
  );
  const canvas = page.locator("canvas[data-ink-sparkle]");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
  expect((await uniforms(canvas)).center).toEqual([-24, 90]);
  await page.clock.runFor(400);
  expect((await uniforms(canvas)).center).toEqual([-24, 90]);
});

test("one-shot playback finishes once and stays finished", async ({ page }) => {
  await pauseClock(page);
  await page.goto(
    "/iframe.html?id=effects-inksparkle--single-burst&viewMode=story",
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
