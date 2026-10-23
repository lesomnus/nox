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
  test(`pending ${checked ? "off" : "on"} expands an eased ripple toward the destination and supports reduced motion`, async ({
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
    expect(reduced.scale).toBeCloseTo(1);
    expect(reduced.left).toBe(checked ? 24 : -16);
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
          (item as CSSAnimation).animationName.includes("rail_ripple"),
        )!;
      animation.pause();
      animation.currentTime = 200;
      const start = new DOMMatrix(getComputedStyle(node, "::after").transform);
      const startOpacity = getComputedStyle(node, "::after").opacity;
      animation.currentTime = 900;
      const end = new DOMMatrix(getComputedStyle(node, "::after").transform);
      const endOpacity = getComputedStyle(node, "::after").opacity;
      animation.currentTime = 1550;
      const tailOpacity = getComputedStyle(node, "::after").opacity;
      return {
        tailOpacity,
        startScale: start.a,
        endScale: end.a,
        startX: start.m41,
        endX: end.m41,
        startOpacity,
        endOpacity,
      };
    });
    expect(scales.endScale).toBeGreaterThan(scales.startScale);
    expect(scales.endScale - scales.startScale).toBeGreaterThan(0.3);
    if (checked) expect(scales.endX).toBeLessThan(scales.startX);
    else expect(scales.endX).toBeGreaterThan(scales.startX);
    expect(Number(scales.startOpacity)).toBeGreaterThan(0.8);
    expect(Number(scales.endOpacity)).toBeGreaterThan(0.8);
    expect(Number(scales.tailOpacity)).toBeLessThan(0.2);
  });
}
