import { expect, test, type Page } from "@playwright/test";

type Metrics = {
  draws: number;
  hash: number;
  colored: number;
  programs: number;
  buffers: number;
  shaders: number;
  arrays: number;
};
declare global {
  interface Window {
    stippleMetrics: Metrics;
    restoreStipple?: () => void;
  }
}

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
  await page.addInitScript(() => {
    const metrics = (window.stippleMetrics = {
      draws: 0,
      hash: 0,
      colored: 0,
      programs: 0,
      buffers: 0,
      shaders: 0,
      arrays: 0,
    });
    const proto = WebGL2RenderingContext.prototype;
    for (const [create, remove, key] of [
      ["createProgram", "deleteProgram", "programs"],
      ["createBuffer", "deleteBuffer", "buffers"],
      ["createShader", "deleteShader", "shaders"],
      ["createVertexArray", "deleteVertexArray", "arrays"],
    ] as const) {
      const originalCreate = proto[create] as (...args: unknown[]) => unknown;
      const originalRemove = proto[remove] as (...args: unknown[]) => unknown;
      Object.defineProperty(proto, create, {
        value: function (this: WebGL2RenderingContext, ...args: unknown[]) {
          const result = originalCreate.apply(this, args);
          if (result) metrics[key]++;
          return result;
        },
      });
      Object.defineProperty(proto, remove, {
        value: function (this: WebGL2RenderingContext, ...args: unknown[]) {
          if (args[0]) metrics[key]--;
          return originalRemove.apply(this, args);
        },
      });
    }
    const draw = proto.drawArrays;
    proto.drawArrays = function (...args) {
      draw.apply(this, args);
      const bytes = new Uint8Array(
        this.drawingBufferWidth * this.drawingBufferHeight * 4,
      );
      this.readPixels(
        0,
        0,
        this.drawingBufferWidth,
        this.drawingBufferHeight,
        this.RGBA,
        this.UNSIGNED_BYTE,
        bytes,
      );
      let hash = 2166136261,
        colored = 0;
      for (let i = 0; i < bytes.length; i += 4) {
        hash = Math.imul(hash ^ bytes[i], 16777619);
        hash = Math.imul(hash ^ bytes[i + 1], 16777619);
        if (bytes[i + 1] > 100) colored++;
      }
      metrics.draws++;
      metrics.hash = hash >>> 0;
      metrics.colored = colored;
    };
  });
});

const story = (name: string, args = "") =>
  `/iframe.html?id=effects-stipplebackground--${name}&viewMode=story&args=maxWidth:96;maxFps:10${args ? ";" + args : ""}`;
const stats = (page: Page) => page.evaluate(() => window.stippleMetrics);
const settledDraws = async (page: Page) => {
  await page.waitForTimeout(120);
  const before = (await stats(page)).draws;
  await page.waitForTimeout(250);
  expect((await stats(page)).draws).toBe(before);
};

test("all five patterns produce actual colored pixels within the raster budget", async ({
  page,
}) => {
  const hashes = new Set<number>();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const name of ["diamond", "bayer", "checker", "hex", "fractal"]) {
    await page.goto(story(name, "paused:true"));
    await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
    await expect
      .poll(async () => (await stats(page)).colored)
      .toBeGreaterThan(0);
    const canvas = page.locator("canvas");
    expect(
      await canvas.evaluate((el: HTMLCanvasElement) => el.width),
    ).toBeLessThanOrEqual(96);
    await expect(canvas).toHaveAttribute("aria-hidden", "true");
    await expect(canvas).toHaveCSS("pointer-events", "none");
    hashes.add((await stats(page)).hash);
    await settledDraws(page);
  }
  expect(hashes.size).toBe(5);
  expect(errors).toEqual([]);
});

test("content works above the canvas and live pattern/pause changes reuse GPU resources", async ({
  page,
}) => {
  await page.goto(story("with-content"));
  await expect.poll(async () => (await stats(page)).draws).toBeGreaterThan(3);
  const canvas = await page.locator("canvas").elementHandle();
  const programs = (await stats(page)).programs;
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await settledDraws(page);
  const hash = (await stats(page)).hash;
  await page.getByRole("button", { name: "Change pattern" }).click();
  await expect.poll(async () => (await stats(page)).hash).not.toBe(hash);
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(
    await canvas!.evaluate((el) => el === document.querySelector("canvas")),
  ).toBe(true);
  expect((await stats(page)).programs).toBe(programs);
  await page
    .locator("[data-renderer]")
    .evaluate((el) => (el.style.width = "360px"));
  await expect
    .poll(() =>
      page.locator("canvas").evaluate((el: HTMLCanvasElement) => el.height),
    )
    .toBeGreaterThan(90);
  await settledDraws(page);
  const before = (await stats(page)).draws;
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect
    .poll(async () => (await stats(page)).draws)
    .toBeGreaterThan(before);
});

test("reduced motion and zero speed render a still image", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(story("diamond"));
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  await expect.poll(async () => (await stats(page)).colored).toBeGreaterThan(0);
  await settledDraws(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(story("diamond", "speed:0"));
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  await settledDraws(page);
});

test("unavailable WebGL keeps the fallback and child controls usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      options?: unknown,
    ) {
      return type === "webgl2"
        ? null
        : original.call(
            this,
            type as "2d",
            options as CanvasRenderingContext2DSettings,
          );
    } as typeof original;
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(story("with-content"));
  const fallback = page.locator('[data-renderer="fallback"]');
  await expect(fallback).toBeVisible();
  await expect(fallback).toHaveCSS("background-color", "rgb(10, 20, 56)");
  await expect(page.locator("canvas")).toBeHidden();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("context loss falls back and restoration resumes drawing", async ({
  page,
}) => {
  await page.goto(story("diamond"));
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  const supported = await page
    .locator("canvas")
    .evaluate((canvas: HTMLCanvasElement) => {
      const extension = canvas
        .getContext("webgl2")!
        .getExtension("WEBGL_lose_context");
      if (!extension) return false;
      window.restoreStipple = () => extension.restoreContext();
      extension.loseContext();
      return true;
    });
  expect(supported).toBe(true);
  await expect(page.locator('[data-renderer="fallback"]')).toBeVisible();
  await page.waitForTimeout(100);
  await page.evaluate(() => window.restoreStipple!());
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  await expect.poll(async () => (await stats(page)).colored).toBeGreaterThan(0);
});

test("unmount releases every GPU object and stops drawing before remount", async ({
  page,
}) => {
  await page.goto(story("strict-lifecycle"));
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  await page.getByRole("button", { name: "Unmount", exact: true }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect
    .poll(async () => {
      const value = await stats(page);
      return [value.programs, value.buffers, value.shaders, value.arrays];
    })
    .toEqual([0, 0, 0, 0]);
  await settledDraws(page);
  await page.getByRole("button", { name: "Mount", exact: true }).click();
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  await expect.poll(async () => (await stats(page)).programs).toBe(1);
});

test("offscreen and hidden backgrounds suspend drawing", async ({ page }) => {
  await page.goto(story("diamond"));
  await expect.poll(async () => (await stats(page)).draws).toBeGreaterThan(3);
  const surface = page.locator("[data-renderer]");
  await surface.evaluate((el) => (el.style.transform = "translateY(300vh)"));
  await settledDraws(page);
  await surface.evaluate((el) => (el.style.transform = "none"));
  const before = (await stats(page)).draws;
  await expect
    .poll(async () => (await stats(page)).draws)
    .toBeGreaterThan(before);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await settledDraws(page);
});
