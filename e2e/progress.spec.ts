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

async function fillRatio(progress: Locator) {
  return progress.evaluate((el) => {
    const rail = el.querySelector<HTMLElement>('[data-progress="rail"]')!;
    const fill = el.querySelector<HTMLElement>('[data-progress="fill"]')!;
    return (
      fill.getBoundingClientRect().width / rail.getBoundingClientRect().width
    );
  });
}

for (const theme of ["dark", "light"]) {
  test(`Progress displays an accessible static fill in ${theme}`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-progress--static&viewMode=story&globals=theme:${theme}`,
    );
    const progress = page.getByRole("progressbar", {
      name: "Download progress",
    });
    await expect(progress).toHaveAttribute("aria-valuemin", "0");
    await expect(progress).toHaveAttribute("aria-valuemax", "100");
    await expect(progress).toHaveAttribute("aria-valuenow", "45");
    expect(await fillRatio(progress)).toBeCloseTo(0.45, 2);
    await expect(progress.locator("canvas")).toHaveCount(0);
    const fill = progress.locator('[data-progress="fill"]');
    await expect(fill).toHaveCSS("transition-duration", "0s");
    await expect(fill).toHaveCSS(
      "background-color",
      theme === "dark" ? "rgb(160, 160, 160)" : "rgb(95, 95, 95)",
    );
  });
}

test("bordered Progress owns its narrow inset and concentric corners", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-progress--bordered&viewMode=story&args=animated:false",
  );
  const progress = page.getByRole("progressbar");
  await expect(progress).toHaveCSS("border-top-width", "1px");
  await expect(progress).toHaveCSS("padding", "2px");
  const spacing = await progress.evaluate((el) => {
    const rail = el.querySelector<HTMLElement>('[data-progress="rail"]')!;
    const outer = el.getBoundingClientRect();
    const inner = rail.getBoundingClientRect();
    const style = getComputedStyle(el);
    const border = parseFloat(style.borderTopWidth);
    return {
      gaps: [
        inner.x - outer.x - border,
        inner.y - outer.y - border,
        outer.right - inner.right - border,
        outer.bottom - inner.bottom - border,
      ],
      radius: parseFloat(style.borderTopLeftRadius),
      railRadius: parseFloat(getComputedStyle(rail).borderTopLeftRadius),
      border,
    };
  });
  for (const gap of spacing.gaps) expect(gap).toBeCloseTo(2, 2);
  expect(spacing.radius).toBeCloseTo(
    spacing.railRadius + spacing.border + 2,
    2,
  );
});

test("value and animation controls update the same reusable component", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    "/iframe.html?id=components-progress--interactive&viewMode=story",
  );
  const progress = page.getByRole("progressbar", { name: "Download progress" });
  const canvas = progress.locator("canvas[data-ink-sparkle]");
  const toggle = page.getByRole("switch", { name: "Animate progress" });
  const slider = page.getByRole("slider", { name: "Progress value" });
  await expect(canvas).toHaveCount(1);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(canvas).toHaveCount(0);
  await slider.press("Home");
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  expect(await fillRatio(progress)).toBe(0);
  await toggle.click();
  await expect(canvas).toHaveCount(0);
  await slider.press("End");
  await expect(progress).toHaveAttribute("aria-valuenow", "100");
  expect(await fillRatio(progress)).toBeCloseTo(1, 2);
  await expect(canvas).toHaveCount(1);
  await expect(progress.locator('[data-progress="fill"]')).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await toggle.click();
  await expect(canvas).toHaveCount(0);
});

test("custom maxima and out-of-range values retain consistent semantics and fill", async ({
  page,
}) => {
  for (const { value, max, current, maximum, ratio } of [
    { value: 50, max: 200, current: 50, maximum: 200, ratio: 0.25 },
    { value: 500, max: 100, current: 100, maximum: 100, ratio: 1 },
    { value: -5, max: 0, current: 0, maximum: 100, ratio: 0 },
  ]) {
    await page.goto(
      `/iframe.html?id=components-progress--static&viewMode=story&args=value:${value};max:${max}`,
    );
    const progress = page.getByRole("progressbar");
    await expect(progress).toHaveAttribute("aria-valuemax", String(maximum));
    await expect(progress).toHaveAttribute("aria-valuenow", String(current));
    expect(await fillRatio(progress)).toBeCloseTo(ratio, 2);
  }
});

test.describe("InkSparkle animation", () => {
  test("the real shader loops around a fixed center outside the left edge", async ({
    page,
  }) => {
    const start = new Date("2026-01-01T00:00:00Z");
    await page.clock.install({ time: start });
    await page.clock.pauseAt(new Date(start.getTime() + 60_000));
    await page.goto(
      "/iframe.html?id=components-progress--default&viewMode=story",
    );
    const canvas = page
      .getByRole("progressbar")
      .locator("canvas[data-ink-sparkle]");
    await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
    const frame = () =>
      canvas.evaluate((node) => {
        const gl = (node as HTMLCanvasElement).getContext("webgl2")!;
        const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
        return {
          center: Array.from(
            gl.getUniform(
              program,
              gl.getUniformLocation(program, "u_center")!,
            ) as Float32Array,
          ),
          composite: Array.from(
            gl.getUniform(
              program,
              gl.getUniformLocation(program, "u_composite_1")!,
            ) as Float32Array,
          ),
          height: node.clientHeight,
        };
      });
    const initial = await frame();
    expect(initial.center[0]).toBeLessThan(0);
    expect(initial.center[1]).toBeCloseTo(initial.height / 2, 2);
    await page.clock.runFor(600);
    const expanded = await frame();
    expect(expanded.center).toEqual(initial.center);
    expect(expanded.composite[3]).toBeGreaterThan(initial.composite[3]);
    await page.clock.runFor(2000);
    expect((await frame()).center).toEqual(initial.center);
    await expect(canvas).toBeVisible();
  });
});
