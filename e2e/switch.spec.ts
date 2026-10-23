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
    await expect(control).toHaveCSS("overflow", "hidden");
    await expect(thumb).toHaveCSS("z-index", "1");
    const reduced = await control.evaluate((node) => {
      const style = getComputedStyle(node, "::after");
      return {
        animation: style.animationName,
        scale: new DOMMatrix(style.transform).a,
        left: parseFloat(style.left),
        background: style.backgroundImage,
        thumbContent: getComputedStyle(node.firstElementChild!, "::after")
          .content,
        zIndex: style.zIndex,
      };
    });
    expect(reduced.animation).toBe("none");
    expect(reduced.scale).toBeCloseTo(1.2);
    expect(reduced.left).toBe(checked ? 5 : -29);
    expect(reduced.background).toContain("radial-gradient");
    expect(reduced.background).toContain(
      checked ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.5)",
    );
    expect(reduced.thumbContent).toBe("none");
    expect(reduced.zIndex).toBe("0");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect
      .poll(() =>
        control.evaluate(
          (node) => getComputedStyle(node, "::after").animationName,
        ),
      )
      .not.toBe("none");
    const scales = await control.evaluate((node) => {
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
