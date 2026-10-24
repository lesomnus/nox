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

test("LinkButton retains keyboard navigation and a clean accessible name", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-linkbutton--default&viewMode=story",
  );
  const link = page.getByRole("link", {
    name: "Personal account",
    exact: true,
  });
  await expect(link).toHaveAttribute("href", "#account");
  await link.focus();
  await link.press("Enter");
  await expect(page).toHaveURL(/#account$/);
  await page.goto(
    "/iframe.html?id=components-linkbutton--truncated&viewMode=story",
  );
  await expect(page.getByRole("link")).toHaveAccessibleName(
    "A long account name that does not fit inside this link",
  );
});

test("Skeleton has stable dimensions and honors reduced motion", async ({
  page,
}) => {
  const start = new Date("2026-01-01T00:00:00Z");
  await page.clock.install({ time: start });
  await page.clock.pauseAt(new Date(start.getTime() + 60_000));
  await page.goto(
    "/iframe.html?id=components-skeleton--default&viewMode=story",
  );
  const placeholder = page.locator(
    '#storybook-root [aria-hidden="true"][data-variant="text"]',
  );
  await expect(placeholder).toBeVisible();
  const before = (await placeholder.boundingBox())!;
  const canvas = placeholder.locator("canvas[data-ink-sparkle]");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
  const frame = () =>
    canvas.evaluate((node) => {
      const gl = (node as HTMLCanvasElement).getContext("webgl2")!;
      const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
      return Array.from(
        gl.getUniform(
          program,
          gl.getUniformLocation(program, "u_composite_1")!,
        ) as Float32Array,
      );
    });
  await page.clock.runFor(250);
  await page.emulateMedia({ reducedMotion: "reduce" });
  // InkSparkle draws one static frame for reduced motion and stops its clock.
  await expect.poll(async () => (await frame())[3]).toBeGreaterThan(0.6);
  const still = await frame();
  await page.clock.runFor(2000);
  expect(await frame()).toEqual(still);
  const after = (await placeholder.boundingBox())!;
  expect(after.width).toBe(before.width);
  expect(after.height).toBe(before.height);
  await page.goto("/iframe.html?id=components-skeleton--circle&viewMode=story");
  const circle = page.locator('#storybook-root [data-variant="circle"]');
  await expect(circle).toHaveCSS("width", "40px");
  await expect(circle).toHaveCSS("height", "40px");
});
