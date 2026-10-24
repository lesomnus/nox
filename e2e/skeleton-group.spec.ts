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
const story = (name: string) =>
  `/iframe.html?id=components-skeleton--${name}&viewMode=story`;

async function inkAlpha(canvas: Locator, box: Locator) {
  const rect = (await box.boundingBox())!;
  return canvas.evaluate((node, box) => {
    const el = node as HTMLCanvasElement;
    const gl = el.getContext("webgl2")!;
    const bounds = el.getBoundingClientRect();
    const x = Math.floor(
      ((box.x + box.width / 2 - bounds.x) * el.width) / bounds.width,
    );
    const y =
      el.height -
      1 -
      Math.floor(
        ((box.y + box.height / 2 - bounds.y) * el.height) / bounds.height,
      );
    const pixel = new Uint8Array(4);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    return pixel[3];
  }, rect);
}

test("one group wave reaches A before B and the mask excludes the gap", async ({
  page,
}) => {
  const start = new Date("2026-01-01T00:00:00Z");
  await page.clock.install({ time: start });
  await page.clock.pauseAt(new Date(start.getTime() + 60_000));
  await page.goto(story("grouped"));
  const group = page.locator('[data-skeleton="group"]');
  const canvas = group.locator("canvas[data-ink-sparkle]");
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
  await page.clock.runFor(500);
  expect(
    await inkAlpha(canvas, group.locator('[data-panel="a"]')),
  ).toBeGreaterThan(0);
  expect(await inkAlpha(canvas, group.locator('[data-panel="b"]'))).toBe(0);
  await page.clock.runFor(500);
  expect(
    await inkAlpha(canvas, group.locator('[data-panel="b"]')),
  ).toBeGreaterThan(0);
  const mask = await group
    .locator('[data-skeleton="effect"]')
    .evaluate(async (node) => {
      const image = new Image();
      image.src = getComputedStyle(node).maskImage.slice(5, -2);
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      const alpha = (x: number, y: number) =>
        context.getImageData(x, y, 1, 1).data[3];
      return {
        a: alpha(96, 40),
        gap: alpha(200, 40),
        b: alpha(304, 40),
        corner: alpha(0, 0),
      };
    });
  expect(mask).toEqual({ a: 255, gap: 0, b: 255, corner: 0 });
});

test("membership and layout changes update the shared mask without adding a canvas", async ({
  page,
}) => {
  await page.goto(story("dynamic-group"));
  const group = page.locator('[data-skeleton="group"]');
  const canvas = group.locator("canvas[data-ink-sparkle]");
  const surface = group.locator('[data-skeleton="effect"]');
  const mask = () =>
    surface.evaluate((node) => (node as HTMLElement).style.maskImage);
  await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
  const initial = await mask();
  await canvas.evaluate((node) => {
    (node as HTMLElement).dataset.testIdentity = "retained";
  });
  await page.getByRole("button", { name: "Add second box" }).click();
  await expect.poll(mask).not.toBe(initial);
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveAttribute("data-test-identity", "retained");
  const added = await mask();
  await page.getByRole("button", { name: "Resize group" }).click();
  await expect.poll(mask).not.toBe(added);
  await expect(canvas).toHaveCSS("width", "260px");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
  expect(
    await canvas.evaluate((node) =>
      (node as HTMLCanvasElement).getContext("webgl2")!.isContextLost(),
    ),
  ).toBe(false);
  await page.getByRole("button", { name: "Remove second box" }).click();
  await expect(group.locator('[data-skeleton="placeholder"]')).toHaveCount(1);
  await expect(canvas).toHaveCount(1);
});

test("theme changes update the active ink color without losing the group context", async ({
  page,
}) => {
  await page.goto(story("grouped"));
  const canvas = page.locator("canvas[data-ink-sparkle]");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
  const red = () =>
    canvas.evaluate((node) => {
      const gl = (node as HTMLCanvasElement).getContext("webgl2")!;
      const program = gl.getParameter(
        gl.CURRENT_PROGRAM,
      ) as WebGLProgram | null;
      return program
        ? (
            gl.getUniform(
              program,
              gl.getUniformLocation(program, "u_color")!,
            ) as Float32Array
          )[0]
        : -1;
    });
  await expect.poll(red).toBeGreaterThan(0.9);
  await page.evaluate(() => {
    document.documentElement.dataset.uiTheme = "light";
  });
  await expect.poll(red).toBeGreaterThanOrEqual(0);
  await expect.poll(red).toBeLessThan(0.1);
  await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
});

test("static groups have no effect and separate groups own separate surfaces", async ({
  page,
}) => {
  await page.goto(story("grouped-static"));
  await expect(page.locator('[data-skeleton="placeholder"]')).toHaveCount(2);
  await expect(page.locator("canvas[data-ink-sparkle]")).toHaveCount(0);
  await page.goto(story("separate-groups"));
  const groups = page.locator('[data-skeleton="group"]');
  await expect(groups).toHaveCount(2);
  for (const group of await groups.all())
    await expect(group.locator("canvas[data-ink-sparkle]")).toHaveCount(1);
});
