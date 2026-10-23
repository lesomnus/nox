import { expect, test, type Page } from "@playwright/test";

type Metrics = {
  draws: number;
  hash: number;
  colored: number;
  maxRun: number;
  pixelColors: number[];
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
      maxRun: 0,
      pixelColors: [] as number[],
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
        colored = 0,
        maxRun = 0,
        run = 0;
      const pixelColors = new Set<number>();
      for (let i = 0; i < bytes.length; i += 4) {
        pixelColors.add((bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]);
        hash = Math.imul(hash ^ bytes[i], 16777619);
        hash = Math.imul(hash ^ bytes[i + 1], 16777619);
        if ((i / 4) % this.drawingBufferWidth === 0) run = 0;
        if (bytes[i + 1] > 100) {
          colored++;
          maxRun = Math.max(maxRun, ++run);
        } else run = 0;
      }
      metrics.draws++;
      metrics.hash = hash >>> 0;
      metrics.colored = colored;
      metrics.maxRun = maxRun;
      metrics.pixelColors = [...pixelColors];
    };
  });
});

const story = (name: string, args = "", seeded = true) =>
  `/iframe.html?id=effects-stipplebackground--${name}&viewMode=story&args=maxWidth:96;maxFps:10${seeded ? ";seed:1" : ""}${args ? ";" + args : ""}`;
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
  await page.getByRole("button", { name: "Change pattern" }).click();
  await expect.poll(async () => (await stats(page)).hash).toBe(hash);
  await page.getByRole("button", { name: "Change palette" }).click();
  await expect.poll(async () => (await stats(page)).hash).not.toBe(hash);
  const palette = await page
    .locator("canvas")
    .evaluate((el: HTMLCanvasElement) => {
      const gl = el.getContext("webgl2")!;
      const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
      return Array.from({ length: 4 }, (_, i) => [
        ...gl.getUniform(
          program,
          gl.getUniformLocation(program, `uColors[${i}]`)!,
        ),
      ]);
    });
  const expected = [
    [246, 189, 96],
    [242, 132, 130],
    [132, 165, 157],
    [184, 184, 255],
  ];
  palette.forEach((color, i) =>
    color.forEach((value, j) =>
      expect(value).toBeCloseTo(expected[i][j] / 255, 5),
    ),
  );
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

test("cluster centers remain stippled without solid debug fills", async ({
  page,
}) => {
  await page.goto(story("checker", "paused:true;maxWidth:540;grainPx:2"));
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  const metrics = await stats(page);
  expect(metrics.colored).toBeGreaterThan(100);
  expect(metrics.maxRun).toBeLessThanOrEqual(6);
});

test("the exported cluster preset matches the default and supports shape composition", async ({
  page,
}) => {
  await page.goto(story("diamond", "paused:true"));
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  const defaultHash = (await stats(page)).hash;
  await page.goto(story("cluster-motion", "paused:true"));
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  expect((await stats(page)).hash).toBe(defaultHash);
  await settledDraws(page);
  await page.goto(story("modified-cluster-motion", "paused:true"));
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  expect((await stats(page)).hash).not.toBe(defaultHash);
  const shape = await page
    .locator("canvas")
    .evaluate((el: HTMLCanvasElement) => {
      const gl = el.getContext("webgl2")!;
      const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
      return [
        ...gl.getUniform(
          program,
          gl.getUniformLocation(program, "uShapes[0]")!,
        ),
      ];
    });
  expect(shape[0]).toBeCloseTo(1.6);
  expect(shape[1]).toBeCloseTo(0.7);
  expect(shape[3]).toBe(1);
});

test("gradient mixes dot colors while dither retains only the original palette", async ({
  page,
}) => {
  const palette = [0xff6b9d, 0x70e1d0];
  const allowed = new Set([0x0e1116, ...palette]);
  const hashes: number[] = [];
  for (const mode of ["gradient", "dither", "none"]) {
    await page.goto(
      story("gradient-blend", `paused:true;maxWidth:360;colorBlend:${mode}`),
    );
    await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
    const metrics = await stats(page);
    hashes.push(metrics.hash);
    if (mode === "gradient") {
      expect(metrics.pixelColors.length).toBeGreaterThan(8);
      expect(metrics.pixelColors.some((color) => !allowed.has(color))).toBe(
        true,
      );
    } else {
      expect(metrics.pixelColors.every((color) => allowed.has(color))).toBe(
        true,
      );
      for (const color of palette) expect(metrics.pixelColors).toContain(color);
    }
    await settledDraws(page);
  }
  expect(new Set(hashes).size).toBe(3);
});

test("custom motion controls ellipses and responds to trajectory, viewport and empty sample changes", async ({
  page,
}) => {
  await page.goto(story("custom-motion", "paused:true"));
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  const uniforms = () =>
    page.locator("canvas").evaluate((el: HTMLCanvasElement) => {
      const gl = el.getContext("webgl2")!;
      const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
      const get = (name: string) =>
        gl.getUniform(program, gl.getUniformLocation(program, name)!);
      return {
        count: get("uCount") as number,
        shape: [...get("uShapes[0]")],
        blob: [...get("uBlobs[0]")],
      };
    });
  const initial = await uniforms();
  expect(initial.count).toBe(2);
  expect(initial.shape[0]).toBeCloseTo(1.7);
  expect(initial.shape[1]).toBeCloseTo(0.6);
  expect(initial.shape[2]).toBeCloseTo(-0.4);
  const programs = (await stats(page)).programs;
  await page
    .locator("[data-renderer]")
    .evaluate((el) => (el.style.width = "360px"));
  await expect
    .poll(async () => (await uniforms()).blob[0])
    .toBeCloseTo((0.18 * 360) / 380, 4);
  const hash = (await stats(page)).hash;
  await page.getByRole("button", { name: "Change trajectory" }).click();
  await expect.poll(async () => (await stats(page)).hash).not.toBe(hash);
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect.poll(async () => (await uniforms()).count).toBe(0);
  expect((await stats(page)).pixelColors).toEqual([0x0a1438]);
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await expect.poll(async () => (await uniforms()).count).toBe(2);
  expect((await stats(page)).programs).toBe(programs);
  await settledDraws(page);
});

test("omitting seed randomizes each mount while explicit seeds reproduce the arrangement", async ({
  page,
}) => {
  const positions = () =>
    page.locator("canvas").evaluate((el: HTMLCanvasElement) => {
      const gl = el.getContext("webgl2")!;
      const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
      return [
        ...gl.getUniform(program, gl.getUniformLocation(program, "uBlobs[0]")!),
      ];
    });
  for (const seeded of [false, true]) {
    await page.goto(story("strict-lifecycle", "paused:true", seeded));
    await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
    const before = await positions();
    await page.getByRole("button", { name: "Unmount", exact: true }).click();
    await page.getByRole("button", { name: "Mount", exact: true }).click();
    await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
    if (seeded) expect(await positions()).toEqual(before);
    else expect(await positions()).not.toEqual(before);
  }
});

test("a throwing motion callback falls back without an uncaught error and a corrected callback recovers", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(story("motion-recovery"));
  await expect(page.locator('[data-renderer="fallback"]')).toBeVisible();
  await settledDraws(page);
  await page.getByRole("button", { name: "Use valid motion" }).click();
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  await expect.poll(async () => (await stats(page)).draws).toBeGreaterThan(2);
  expect(errors).toEqual([]);
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
