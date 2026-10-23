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
    stippleProbeRow?: { width: number; height: number; pixels: number[] };
    checkStippleDotColors?: boolean;
    stippleDotProbe?: { dots: number; splitDots: number };
    stippleShapeProbe?: number[];
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
      if (window.checkStippleDotColors) {
        const width = this.drawingBufferWidth;
        const total = width * this.drawingBufferHeight;
        const visited = new Uint8Array(total);
        const colorAt = (index: number) =>
          (bytes[index * 4] << 16) |
          (bytes[index * 4 + 1] << 8) |
          bytes[index * 4 + 2];
        let dots = 0,
          splitDots = 0;
        for (let index = 0; index < total; index++) {
          const color = colorAt(index);
          if (visited[index] || !color) continue;
          dots++;
          let split = false;
          const stack = [index];
          visited[index] = 1;
          while (stack.length) {
            const current = stack.pop()!;
            if (colorAt(current) !== color) split = true;
            const x = current % width;
            const neighbors = [
              ...(x > 0 ? [current - 1] : []),
              ...(x + 1 < width ? [current + 1] : []),
              ...(current >= width ? [current - width] : []),
              ...(current + width < total ? [current + width] : []),
            ];
            for (const next of neighbors)
              if (!visited[next] && colorAt(next)) {
                visited[next] = 1;
                stack.push(next);
              }
          }
          if (split) splitDots++;
        }
        window.stippleDotProbe = { dots, splitDots };
      }
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

test("liquid fields have a genuinely concave silhouette, animate in place and can return to an ellipse", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const proto = WebGL2RenderingContext.prototype;
    const draw = proto.drawArrays;
    proto.drawArrays = function (...args) {
      draw.apply(this, args);
      const radius = this.drawingBufferHeight * 0.28;
      window.stippleShapeProbe = [-0.45, 0, 0.45].map((y) => {
        const pixels = new Uint8Array(12 * 12 * 4);
        this.readPixels(
          Math.round(this.drawingBufferWidth * 0.5 + radius * 0.75) - 6,
          Math.round(this.drawingBufferHeight * 0.5 + radius * y) - 6,
          12,
          12,
          this.RGBA,
          this.UNSIGNED_BYTE,
          pixels,
        );
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > 100) count++;
        return count;
      });
    };
  });
  await page.goto(
    story("liquid-metaball", "paused:true;maxWidth:600;scatterPx:0"),
  );
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  const probe = () => page.evaluate(() => window.stippleShapeProbe!);
  const [lower, dent, upper] = await probe();
  expect(lower).toBeGreaterThan(3);
  expect(upper).toBeGreaterThan(3);
  expect(dent).toBe(0);
  const programs = (await stats(page)).programs;
  await page.getByRole("button", { name: "Use ellipse" }).click();
  await expect.poll(async () => (await probe())[1]).toBeGreaterThan(3);
  const ellipse = await probe();
  expect(ellipse.every((count) => count > 3)).toBe(true);
  expect((await stats(page)).programs).toBe(programs);
  await settledDraws(page);
  await page.goto(story("liquid-metaball", "speed:1"));
  await expect.poll(async () => (await stats(page)).colored).toBeGreaterThan(0);
  const hash = (await stats(page)).hash;
  await expect.poll(async () => (await stats(page)).hash).not.toBe(hash);
});

test("work motion blooms, keeps drifting through finish, sleeps when empty and restarts on the same GPU", async ({
  page,
}) => {
  await page.goto(story("work-motion", "speed:1"));
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  expect((await stats(page)).colored).toBe(0);
  await settledDraws(page);
  const programs = (await stats(page)).programs;
  const canvas = await page.locator("canvas").elementHandle();
  await page.getByRole("button", { name: "Start work" }).click();
  await expect.poll(async () => (await stats(page)).colored).toBeGreaterThan(0);
  const initial = (await stats(page)).hash;
  await expect.poll(async () => (await stats(page)).hash).not.toBe(initial);
  await page.getByRole("button", { name: "Finish work" }).click();
  expect((await stats(page)).colored).toBeGreaterThan(0);
  await expect.poll(async () => (await stats(page)).colored).toBe(0);
  await expect
    .poll(() =>
      page.locator("canvas").evaluate((el: HTMLCanvasElement) => {
        const gl = el.getContext("webgl2")!;
        const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
        return gl.getUniform(
          program,
          gl.getUniformLocation(program, "uCount")!,
        );
      }),
    )
    .toBe(0);
  await settledDraws(page);
  await page.getByRole("button", { name: "Start work" }).click();
  await expect.poll(async () => (await stats(page)).colored).toBeGreaterThan(0);
  expect((await stats(page)).programs).toBe(programs);
  expect(
    await canvas!.evaluate((el) => el === document.querySelector("canvas")),
  ).toBe(true);
});

test("work motion respects reduced motion without leaving an invisible active background", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(story("work-motion"));
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  expect((await stats(page)).colored).toBe(0);
  await page.getByRole("button", { name: "Start work" }).click();
  await expect.poll(async () => (await stats(page)).colored).toBeGreaterThan(0);
  await settledDraws(page);
  await page.getByRole("button", { name: "Finish work" }).click();
  await expect.poll(async () => (await stats(page)).colored).toBe(0);
  await settledDraws(page);
});

test("active work lets individual GPU fields disappear and regrow without restarting the background", async ({
  page,
}) => {
  test.setTimeout(40000);
  await page.goto(story("work-motion", "speed:2"));
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  await page.getByRole("button", { name: "Start work" }).click();
  const programs = (await stats(page)).programs;
  const envelopes = () =>
    page.locator("canvas").evaluate((el: HTMLCanvasElement) => {
      const gl = el.getContext("webgl2")!;
      const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
      const count = gl.getUniform(
        program,
        gl.getUniformLocation(program, "uCount")!,
      ) as number;
      return Array.from(
        { length: count },
        (_, i) =>
          gl.getUniform(
            program,
            gl.getUniformLocation(program, `uEnvelopes[${i}]`)!,
          ) as number,
      );
    });
  const grown = new Set<number>();
  let vanished = -1;
  await expect
    .poll(
      async () => {
        const values = await envelopes();
        values.forEach((value, i) => {
          if (value > 0.9) grown.add(i);
        });
        vanished = values.findIndex((value, i) => value === 0 && grown.has(i));
        return vanished;
      },
      { timeout: 18000, intervals: [200] },
    )
    .toBeGreaterThanOrEqual(0);
  await expect(page.getByRole("button", { name: "Finish work" })).toBeVisible();
  await expect
    .poll(async () => (await envelopes())[vanished], {
      timeout: 8000,
      intervals: [200],
    })
    .toBeGreaterThan(0.1);
  expect((await stats(page)).programs).toBe(programs);
});

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

test("fade shades are bounded and each connected dot stays a single solid color", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.checkStippleDotColors = true;
  });
  for (const count of [0, 1, 3]) {
    await page.goto(
      story(
        "edge-fade",
        `paused:true;maxWidth:360;grainPx:2;edgeFadeSteps:${count}`,
      ),
    );
    await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
    const values = await stats(page);
    const allowed = new Set([0]);
    for (let shade = 0; shade <= count; shade++) {
      const value = Math.round(255 * (1 - shade / (count + 1)));
      allowed.add((value << 16) | (value << 8) | value);
    }
    expect(values.pixelColors.every((color) => allowed.has(color))).toBe(true);
    expect(values.pixelColors.length).toBeLessThanOrEqual(count + 2);
    expect(values.pixelColors).toContain(0xffffff);
    if (count <= 1) expect(new Set(values.pixelColors)).toEqual(allowed);
    else expect(values.pixelColors.length).toBeGreaterThan(2);
    const probe = await page.evaluate(() => window.stippleDotProbe!);
    expect(probe.dots).toBeGreaterThan(100);
    expect(probe.splitDots).toBe(0);
    await settledDraws(page);
  }
  await page.goto(story("edge-fade", "paused:true;maxWidth:360;grainPx:2"));
  await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
  expect(new Set((await stats(page)).pixelColors)).toEqual(
    new Set([0, 0xffffff, 0x808080]),
  );
});

test("edge fade softens peripheral dots while retaining centers and dot placement for every blend mode", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      draw.apply(this, args);
      const pixels = new Uint8Array(this.drawingBufferWidth * 4);
      this.readPixels(
        0,
        Math.floor(this.drawingBufferHeight / 2),
        this.drawingBufferWidth,
        1,
        this.RGBA,
        this.UNSIGNED_BYTE,
        pixels,
      );
      window.stippleProbeRow = {
        width: this.drawingBufferWidth,
        height: this.drawingBufferHeight,
        pixels: [...pixels],
      };
    };
  });
  for (const mode of ["gradient", "dither", "none"]) {
    const args = `paused:true;maxWidth:360;pattern:checker;scatterPx:100;colorBlend:${mode}`;
    await page.goto(story("edge-fade", `${args};edgeFade:0`));
    await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
    const flat = await page.evaluate(() => window.stippleProbeRow!);
    await page.goto(story("edge-fade", `${args};edgeFade:0.8`));
    await expect(page.locator('[data-renderer="webgl2"]')).toBeVisible();
    const faded = await page.evaluate(() => window.stippleProbeRow!);
    expect(faded.width).toBe(flat.width);
    const center: number[] = [],
      edge: number[] = [];
    for (let x = 0; x < faded.width; x++) {
      const before = flat.pixels[x * 4],
        after = faded.pixels[x * 4];
      expect(after > 0).toBe(before > 0);
      expect(after).toBeLessThanOrEqual(before);
      if (!before) continue;
      const distance = Math.abs(x + 0.5 - faded.width / 2) / faded.height;
      if (distance < 0.08) center.push(after);
      if (distance > 0.3 && distance < 0.45) edge.push(after);
      expect(faded.pixels[x * 4 + 3]).toBe(255);
    }
    expect(center.length).toBeGreaterThan(0);
    expect(edge.length).toBeGreaterThan(0);
    const average = (values: number[]) =>
      values.reduce((a, b) => a + b, 0) / values.length;
    expect(average(center)).toBeGreaterThan(240);
    expect(average(edge)).toBeLessThan(200);
    expect(average(center)).toBeGreaterThan(average(edge));
    await settledDraws(page);
  }
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
