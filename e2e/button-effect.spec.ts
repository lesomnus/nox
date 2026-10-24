import { expect, test, type Page } from "@playwright/test";

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

async function open(page: Page, story: string) {
  const start = new Date("2026-01-01T00:00:00Z");
  await page.clock.install({ time: start });
  await page.clock.pauseAt(new Date(start.getTime() + 60_000));
  await page.goto(`/iframe.html?id=components-button--${story}&viewMode=story`);
}

test("default ink preserves native click cancellation, form submission, callbacks, refs and layout", async ({
  page,
}) => {
  await open(page, "effect-interaction");
  const button = page.getByRole("button", { name: "Save with ink" });
  const ink = page.locator("canvas[data-ink-sparkle]");
  const status = page.getByRole("status");
  await expect(button).toHaveAttribute("data-effect", "sparkle");
  await expect(ink).toHaveCount(0);
  await button.hover();
  await expect(button).toHaveCSS("background-color", "rgb(48, 48, 48)");
  const size = await button.boundingBox();
  const background = await button.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await page.mouse.down();
  await expect(ink).toHaveAttribute("data-renderer", "webgl2");
  expect(
    await ink.evaluate((node: HTMLCanvasElement) => {
      const gl = node.getContext("webgl2")!;
      const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
      return Array.from(
        gl.getUniform(
          program,
          gl.getUniformLocation(program, "u_sparkle_color")!,
        ) as Float32Array,
      );
    }),
  ).toEqual([1, 1, 1, 0.25]);
  await expect(status).toHaveText(
    "Clicks: 0; submits: 0; pointer downs: 1; keys: 0",
  );
  expect(await button.boundingBox()).toEqual(size);
  await expect(button).toHaveCSS("background-color", background);
  await expect(ink).toHaveCSS("pointer-events", "none");
  await expect(button.locator(".button-content")).toHaveCSS("z-index", "1");
  await page.clock.runFor(600);
  await page.mouse.up();
  await expect(status).toHaveText(
    "Clicks: 1; submits: 1; pointer downs: 1; keys: 0",
  );
  await page.clock.runFor(1300);
  await expect(ink).toHaveCount(0);
  await button.hover();
  await expect(button).toHaveCSS("background-color", "rgb(48, 48, 48)");
  await page.mouse.down();
  await page.mouse.move(size!.x - 40, size!.y - 40);
  await page.mouse.up();
  await page.clock.runFor(1300);
  await expect(ink).toHaveCount(0);
  await expect(status).toHaveText(
    "Clicks: 1; submits: 1; pointer downs: 2; keys: 0",
  );
  await page.getByRole("button", { name: "Focus save" }).click();
  await expect(button).toBeFocused();
});

test("keyboard ink is centered and repeat-safe; disabling during a press cleans it up", async ({
  page,
}) => {
  await open(page, "effect-interaction");
  const button = page.getByRole("button", { name: "Save with ink" });
  const ink = page.locator("canvas[data-ink-sparkle]");
  await button.focus();
  await page.keyboard.down("Space");
  await page.keyboard.down("Space");
  await expect(ink).toHaveCount(1);
  const center = await ink.evaluate((node: HTMLCanvasElement) => {
    const gl = node.getContext("webgl2")!,
      p = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
    return Array.from(
      gl.getUniform(p, gl.getUniformLocation(p, "u_center")!) as Float32Array,
    );
  });
  expect(center).toEqual(
    await button.evaluate((el) => [el.clientWidth / 2, el.clientHeight / 2]),
  );
  await page.keyboard.up("Space");
  await page.clock.runFor(1300);
  await expect(ink).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText(
    "Clicks: 1; submits: 1; pointer downs: 0; keys: 2",
  );
  await button.hover();
  await page.mouse.down();
  await expect(ink).toHaveCount(1);
  await page
    .getByRole("button", { name: "Disable save" })
    .evaluate((el: HTMLButtonElement) => el.click());
  await expect(button).toBeDisabled();
  await expect(ink).toHaveAttribute("data-pressed", "false");
  await page.clock.runFor(1300);
  await expect(ink).toHaveCount(0);
  await page.mouse.up();
  await page.getByRole("button", { name: "Enable save" }).click();
  await expect(button).toBeEnabled();
  await button.press("Enter");
  await page.clock.runFor(1300);
  await expect(ink).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText(
    "Clicks: 2; submits: 2;",
  );
});

test("none opts out of canvases and retains the variant's active background", async ({
  page,
}) => {
  await open(page, "no-effect");
  const button = page.getByRole("button", { name: "New session" });
  await expect(button).toHaveAttribute("data-effect", "none");
  await button.hover();
  await expect(button).toHaveCSS("background-color", "rgb(48, 48, 48)");
  const hover = await button.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await page.mouse.down();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect
    .poll(() => button.evaluate((el) => getComputedStyle(el).backgroundColor))
    .not.toBe(hover);
  await page.mouse.up();
});

test("prevented handlers, disabled and loading buttons never allocate ink", async ({
  page,
}) => {
  await open(page, "prevented-press");
  const button = page.getByRole("button", { name: "Handled externally" });
  await button.hover();
  await page.mouse.down();
  await page.mouse.up();
  await button.focus();
  await button.press("Space");
  await expect(page.locator("canvas")).toHaveCount(0);
  for (const story of ["disabled", "loading"]) {
    await page.goto(
      `/iframe.html?id=components-button--${story}&viewMode=story`,
    );
    const target = page.getByRole("button", { name: "New session" });
    await target.dispatchEvent("pointerdown", {
      pointerId: 1,
      isPrimary: true,
      button: 0,
    });
    await target.dispatchEvent("keydown", { key: "Enter" });
    await target.evaluate((el: HTMLButtonElement) => el.click());
    await expect(page.locator("canvas")).toHaveCount(0);
  }
});
