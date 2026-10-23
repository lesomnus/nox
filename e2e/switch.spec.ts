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
    const thumb = control.locator("span");
    await expect(thumb).toHaveCSS("overflow", "hidden");
    const reduced = await thumb.evaluate((node) => {
      const style = getComputedStyle(node, "::after");
      return {
        animation: style.animationName,
        scale: new DOMMatrix(style.transform).a,
        left: parseFloat(style.left),
        background: style.backgroundImage,
        trackContent: getComputedStyle(node.parentElement!, "::after").content,
      };
    });
    expect(reduced.animation).toBe("none");
    expect(reduced.scale).toBeCloseTo(1.2);
    expect(reduced.left).toBe(checked ? 0 : -16);
    expect(reduced.background).toContain("radial-gradient");
    expect(reduced.trackContent).toBe("none");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect
      .poll(() =>
        thumb.evaluate(
          (node) => getComputedStyle(node, "::after").animationName,
        ),
      )
      .not.toBe("none");
    const scales = await thumb.evaluate((node) => {
      const animation = node
        .getAnimations({ subtree: true })
        .find((item) =>
          (item as CSSAnimation).animationName.includes("light_bloom"),
        )!;
      animation.pause();
      animation.currentTime = 200;
      const start = new DOMMatrix(getComputedStyle(node, "::after").transform)
        .a;
      animation.currentTime = 900;
      const end = new DOMMatrix(getComputedStyle(node, "::after").transform).a;
      return { start, end };
    });
    expect(scales.end).toBeGreaterThan(scales.start);
  });
}
