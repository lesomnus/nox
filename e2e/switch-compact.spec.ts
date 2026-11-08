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

test("compact matches text height while preserving default sizing and native activation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/iframe.html?id=components-switch--sizes&viewMode=story");
  const compact = page.getByRole("switch", {
    name: "compact switch",
    exact: true,
  });
  const standard = page.getByRole("switch", {
    name: "default switch",
    exact: true,
  });
  for (const [control, width, height, inset] of [
    [compact, 28, 16, 2],
    [standard, 40, 22, 3],
  ] as const) {
    await expect(control).toHaveCSS("width", `${width}px`);
    await expect(control).toHaveCSS("height", `${height}px`);
    const track = (await control.boundingBox())!;
    const thumb = (await control.locator("[data-switch-thumb]").boundingBox())!;
    expect(thumb.y - track.y).toBe(inset);
    expect(track.y + track.height - thumb.y - thumb.height).toBe(inset);
    expect(track.x + track.width - thumb.x - thumb.width).toBe(inset);
  }
  await compact.click();
  await expect(compact).not.toBeChecked();
  const track = (await compact.boundingBox())!;
  const thumb = (await compact.locator("[data-switch-thumb]").boundingBox())!;
  expect(thumb.x - track.x).toBe(2);
  await compact.press("Space");
  await expect(compact).toBeChecked();
  await compact.press("Enter");
  await expect(compact).not.toBeChecked();
  await page.goto(
    "/iframe.html?id=components-switch--compact&viewMode=story&args=disabled:true",
  );
  await expect(page.getByRole("switch")).toBeDisabled();
  await expect(page.getByRole("switch")).toHaveCSS("height", "16px");
});

for (const checked of [false, true]) {
  test(`compact pending ${checked ? "off" : "on"} centers its handle and effect and blocks repeat input`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(
      `/iframe.html?id=components-switch--turning-${checked ? "off" : "on"}&viewMode=story&args=variant:compact`,
    );
    const control = page.getByRole("switch");
    await expect(control).toHaveAttribute("aria-busy", "true");
    await expect(control).toHaveCSS("width", "28px");
    await expect(control.locator("[data-switch-thumb]")).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, 6, 0)",
    );
    const track = (await control.boundingBox())!;
    const thumb = (await control.locator("[data-switch-thumb]").boundingBox())!;
    expect(thumb.x + thumb.width / 2).toBe(track.x + track.width / 2);
    expect(thumb.y + thumb.height / 2).toBe(track.y + track.height / 2);
    const canvas = control.locator("canvas");
    await expect(canvas).toHaveAttribute("data-renderer", "webgl2");
    const center = await canvas.evaluate((node) => {
      const gl = (node as HTMLCanvasElement).getContext("webgl2")!;
      const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
      return Array.from(
        gl.getUniform(
          program,
          gl.getUniformLocation(program, "u_center")!,
        ) as Float32Array,
      );
    });
    expect(center).toEqual([checked ? 36 : -8, 8]);
    await control.click({ force: true });
    await control.press("Space");
    await expect(control).toHaveAttribute("aria-checked", String(checked));
    await expect(control).toHaveAttribute("aria-busy", "true");
  });
}
