import { expect, test } from "@playwright/test";

test("loading holds press scale without resizing and blocks repeated activation", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-button--loading-interaction&viewMode=story",
  );
  const button = page.getByRole("button", { name: "Save project settings" });
  const content = button.locator(".button-content");
  const size = await button.boundingBox();
  await button.click();
  await expect(button).toHaveAttribute("aria-busy", "true");
  await expect(button).toHaveAttribute("aria-disabled", "true");
  await expect(button).toBeFocused();
  expect(await button.evaluate((el: HTMLButtonElement) => el.disabled)).toBe(
    false,
  );
  await expect
    .poll(() =>
      content.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a),
    )
    .toBeLessThan(1);
  const scale = await content.evaluate(
    (el) => new DOMMatrix(getComputedStyle(el).transform).a,
  );
  expect(scale).toBeGreaterThanOrEqual(0.95);
  expect(await button.boundingBox()).toEqual(size);
  // aria-disabled intentionally blocks Playwright's user click; native click still
  // reaches React, exercising the guard alongside real keyboard activation.
  await button.evaluate((el: HTMLButtonElement) => el.click());
  await button.press("Enter");
  await button.press("Space");
  await expect(page.getByRole("status")).toHaveText("Requests: 1; submits: 1");
  await page.getByRole("button", { name: "Finish loading" }).click();
  await expect(button).not.toHaveAttribute("aria-busy");
  await expect(content).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  await button.click();
  await expect(page.getByRole("status")).toHaveText("Requests: 2; submits: 2");
});

test("sheen clips to nested text while preserving SVG color and the accessible label", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-button--loading-with-icon&viewMode=story",
  );
  const button = page.getByRole("button", { name: "Save changes" });
  const content = button.locator(".button-content");
  await expect(button).toHaveText("Save changes");
  await expect(content).toHaveCSS("background-clip", "text");
  await expect(content).toHaveCSS(
    "-webkit-text-fill-color",
    "rgba(0, 0, 0, 0)",
  );
  const sheen = await content.evaluate((el) => {
    const style = getComputedStyle(el);
    const animation = el
      .getAnimations()
      .find((item) =>
        (item as CSSAnimation).animationName?.includes("loading_sheen"),
      )!;
    animation.pause();
    animation.currentTime = 0;
    const start = getComputedStyle(el).backgroundPosition;
    animation.currentTime = 800;
    return {
      image: style.backgroundImage,
      start,
      end: getComputedStyle(el).backgroundPosition,
    };
  });
  expect(sheen.image).toContain("linear-gradient");
  expect(sheen.start).not.toBe(sheen.end);
  const icon = await button.locator("svg").evaluate((el) => {
    const style = getComputedStyle(el);
    return { stroke: style.stroke, color: style.color };
  });
  expect(icon.stroke).toBe(icon.color);
  expect(icon.stroke).not.toContain("rgba(0, 0, 0, 0)");
});

test("reduced motion holds a static pressed state and normal text color", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/iframe.html?id=components-button--loading&viewMode=story");
  const button = page.getByRole("button", { name: "New session" });
  const content = button.locator(".button-content");
  await expect(button).toHaveAttribute("aria-busy", "true");
  await expect(content).toHaveCSS("animation-name", "none");
  await expect(content).toHaveCSS("background-image", "none");
  await expect(content).toHaveCSS("transition-duration", "0s");
  const styles = await content.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      scale: new DOMMatrix(style.transform).a,
      fill: style.webkitTextFillColor,
      color: style.color,
    };
  });
  expect(styles.scale).toBeLessThan(1);
  expect(styles.fill).toBe(styles.color);
});
