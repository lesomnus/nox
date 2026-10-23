import { expect, test } from "@playwright/test";

test("pending transitions retain the confirmed state and block repeat input", async ({
  page,
}) => {
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
  await control.press("Space");
  await expect(control).toHaveAttribute("aria-busy", "true");
  await expect(control).toBeChecked();
  await expect(control).not.toBeChecked();
  await expect(control).not.toHaveAttribute("aria-busy");
});

for (const checked of [false, true]) {
  test(`pending ${checked ? "off" : "on"} centers the thumb and indicates direction with reduced motion`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(
      `/iframe.html?id=components-switch--turning-${checked ? "off" : "on"}&viewMode=story`,
    );
    const control = page.getByRole("switch");
    await expect(control).toHaveAttribute("aria-checked", String(checked));
    await expect(control).toHaveAttribute("aria-busy", "true");
    await expect(control.locator("span")).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, 9, 0)",
    );
    const reduced = await control.evaluate((node) => {
      const style = getComputedStyle(node, "::after");
      return {
        animation: style.animationName,
        x: new DOMMatrix(style.transform).m41,
      };
    });
    expect(reduced).toEqual({ animation: "none", x: checked ? 0 : 20 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect
      .poll(() =>
        control.evaluate(
          (node) => getComputedStyle(node, "::after").animationName,
        ),
      )
      .not.toBe("none");
    const positions = await control.evaluate(async (node) => {
      await new Promise(requestAnimationFrame);
      const animation = node
        .getAnimations({ subtree: true })
        .find((item) =>
          (item as CSSAnimation).animationName.includes("light_sweep"),
        )!;
      animation.pause();
      animation.currentTime = 200;
      const start = new DOMMatrix(getComputedStyle(node, "::after").transform)
        .m41;
      animation.currentTime = 600;
      const end = new DOMMatrix(getComputedStyle(node, "::after").transform)
        .m41;
      return { start, end };
    });
    if (checked) expect(positions.end).toBeLessThan(positions.start);
    else expect(positions.end).toBeGreaterThan(positions.start);
  });
}
