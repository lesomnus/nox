import { expect, test } from "@playwright/test";

test("pending transitions retain the confirmed state and block repeat input", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = WebGL2RenderingContext.prototype.deleteProgram;
    const metrics = window as typeof window & { deletedInkPrograms: number };
    metrics.deletedInkPrograms = 0;
    WebGL2RenderingContext.prototype.deleteProgram = function (program) {
      if (program) metrics.deletedInkPrograms++;
      original.call(this, program);
    };
  });
  await page.goto(
    "/iframe.html?id=components-switch--async-transition&viewMode=story",
  );
  const control = page.getByRole("switch");
  await expect(control).not.toBeChecked();
  await control.click();
  await expect(control).toHaveAttribute("aria-busy", "true");
  await expect(control).not.toBeChecked();
  await control.press("Space");
  await expect(control).toBeChecked();
  await expect(control).not.toHaveAttribute("aria-busy");
  await expect(control.locator("canvas")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as typeof window & { deletedInkPrograms: number })
            .deletedInkPrograms,
      ),
    )
    .toBeGreaterThan(0);
  await control.press("Space");
  await expect(control).toHaveAttribute("aria-busy", "true");
  await expect(control).toBeChecked();
  await expect(control).not.toBeChecked();
  await expect(control).not.toHaveAttribute("aria-busy");
});

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

for (const checked of [false, true]) {
  test(`pending ${checked ? "off" : "on"} uses the Flutter shader below an opaque handle and freezes with reduced motion`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(
      `/iframe.html?id=components-switch--turning-${checked ? "off" : "on"}&viewMode=story`,
    );
    const control = page.getByRole("switch");
    const canvas = control.locator("canvas");
    await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
    await expect(control).toHaveAttribute("aria-checked", String(checked));
    await expect(control).toHaveAttribute("aria-busy", "true");
    await expect(control.locator("span")).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, 9, 0)",
    );
    await expect(control.locator("span")).toHaveCSS("z-index", "1");
    await expect(canvas).toHaveCSS("z-index", "0");
    const pixels = await canvas.evaluate((node) => {
      const gl = (node as HTMLCanvasElement).getContext("webgl2")!;
      const bytes = new Uint8Array(
        gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
      );
      gl.readPixels(
        0,
        0,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        bytes,
      );
      return {
        visible: bytes.some((value, index) => index % 4 === 3 && value > 0),
        error: gl.getError(),
        center: Array.from(
          gl.getUniform(
            gl.getParameter(gl.CURRENT_PROGRAM),
            gl.getUniformLocation(
              gl.getParameter(gl.CURRENT_PROGRAM),
              "u_center",
            )!,
          ) as Float32Array,
        ),
      };
    });
    expect(pixels.visible).toBe(true);
    expect(pixels.error).toBe(0);
    expect(pixels.center).toEqual([checked ? 48 : -8, 11]);
    const frozen = await control.screenshot();
    const bounds = (await control.locator("span").boundingBox())!;
    const clip = { x: bounds.x + 4, y: bounds.y + 4, width: 8, height: 8 };
    const thumb = await page.screenshot({ clip });
    await page.waitForTimeout(120);
    expect(await control.screenshot()).toEqual(frozen);
    await canvas.evaluate(
      (node) => ((node as HTMLElement).style.visibility = "hidden"),
    );
    expect(await control.screenshot()).not.toEqual(frozen);
    expect(await page.screenshot({ clip })).toEqual(thumb);
  });
}

test("original InkSparkle animates, restores a lost WebGL context and repeats while pending", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto(
    "/iframe.html?id=effects-inksparkle--original&viewMode=story",
  );
  const canvas = page.locator("canvas[data-ink-sparkle]");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
  await page.clock.pauseAt(
    new Date(await page.evaluate(() => Date.now() + 100)),
  );
  await page.clock.runFor(80);
  const first = await canvas.screenshot();
  await page.clock.runFor(180);
  expect(await canvas.screenshot()).not.toEqual(first);
  await page.clock.runFor(617);
  const recurring = await canvas.evaluate((node) => {
    const gl = (node as HTMLCanvasElement).getContext("webgl2")!;
    const bytes = new Uint8Array(
      gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
    );
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      bytes,
    );
    return bytes.some((value, index) => index % 4 === 3 && value > 0);
  });
  expect(recurring).toBe(true);
  await canvas.evaluate((node) => {
    const extension = (node as HTMLCanvasElement)
      .getContext("webgl2")!
      .getExtension("WEBGL_lose_context")!;
    (
      window as typeof window & { restoreInkSparkle?: () => void }
    ).restoreInkSparkle = () => extension.restoreContext();
    extension.loseContext();
  });
  await expect(canvas).toHaveAttribute("data-renderer", "unavailable");
  await page.evaluate(() =>
    (window as typeof window & { restoreInkSparkle?: () => void })
      .restoreInkSparkle!(),
  );
  await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
});

test("pending remains usable without WebGL and removes the canvas when completed", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl2") return null;
      return original.call(this, type as "2d", ...args);
    } as typeof original;
  });
  await page.goto(
    "/iframe.html?id=components-switch--async-transition&viewMode=story",
  );
  const control = page.getByRole("switch");
  await control.click();
  await expect(control.locator("canvas")).toHaveAttribute(
    "data-renderer",
    "unavailable",
  );
  await expect(control).toHaveAttribute("aria-busy", "true");
  await expect(control).toBeChecked();
  await expect(control.locator("canvas")).toHaveCount(0);
});
