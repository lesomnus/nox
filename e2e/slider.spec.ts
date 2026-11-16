import { expect, test } from "@playwright/test";

test("pointer dragging is continuous, magnetic near ticks, and settles to the nearest step", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-slider--magnetic-steps&viewMode=story",
  );
  const slider = page.getByRole("slider", { name: "Volume" });
  await expect(slider).toHaveValue("4");
  const box = (await slider.boundingBox())!;
  const thumb = await slider.evaluate((node) =>
    parseFloat(getComputedStyle(node).getPropertyValue("--slider-thumb-size")),
  );
  const x = (value: number) =>
    box.x + thumb / 2 + ((box.width - thumb) * value) / 8;
  const y = box.y + box.height / 2;
  const visibleValue = () =>
    slider.evaluate(
      (node) =>
        (parseFloat(
          getComputedStyle(node).getPropertyValue("--slider-progress"),
        ) *
          8) /
        100,
    );
  await page.mouse.move(x(4), y);
  await page.mouse.down();
  await page.mouse.move(x(4.3), y, { steps: 4 });
  await expect(slider).toHaveValue("4");
  expect(await visibleValue()).toBeGreaterThan(4.1);
  expect(await visibleValue()).toBeLessThan(4.45);
  await page.mouse.move(x(5.02), y, { steps: 4 });
  await expect(slider).toHaveValue("5");
  expect(await visibleValue()).toBeCloseTo(5, 3);
  await page.mouse.move(x(5.65), y, { steps: 4 });
  await expect(slider).toHaveValue("6");
  expect(await visibleValue()).toBeLessThan(5.9);
  await page.mouse.up();
  await expect(slider).not.toHaveAttribute("data-dragging");
  await expect.poll(visibleValue).toBe(6);
  await slider.press("Home");
  await expect(slider).toHaveValue("0");
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("1");
  await page.mouse.move(x(1), y);
  await page.mouse.down();
  await page.mouse.move(x(10), y);
  await page.mouse.up();
  await expect(slider).toHaveValue("8");
  expect(await visibleValue()).toBe(8);
  await page.mouse.move(x(8), y);
  await page.mouse.down();
  await page.mouse.move(x(-2), y);
  await page.mouse.up();
  await expect(slider).toHaveValue("0");
  expect(await visibleValue()).toBe(0);
});

test("setting ticks animate the selection box and arbitrary integer input preserves bounds", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-settingslider--custom-value&viewMode=story",
  );
  const slider = page.getByRole("slider", { name: "Indentation size" });
  const input = page.getByRole("spinbutton", {
    name: "Indentation size custom value",
  });
  await expect(input).toHaveValue("12");
  const root = page.getByRole("group", { name: "Indentation size" });
  await expect(root.locator("output")).toHaveCount(0);
  await input.fill("17");
  await input.press("Tab");
  await expect(input).toHaveValue("12");
  await input.fill("16");
  await input.press("Enter");
  await expect(slider).toHaveAttribute("aria-valuetext", "16");
  await input.fill("");
  await input.press("Tab");
  await expect(input).toHaveValue("16");
  await slider.press("End");
  await expect(slider).toHaveAttribute("aria-valuetext", "8");
  await expect(input).toHaveValue("");
  await input.fill("12");
  await input.press("Enter");
  const rail = (await slider.boundingBox())!;
  await slider.click({ position: { x: rail.width - 6, y: rail.height / 2 } });
  await expect(slider).toHaveAttribute("aria-valuetext", "8");
  await expect(input).toHaveValue("");
  await slider.press("Home");
  await expect(slider).toHaveAttribute("aria-valuetext", "Inherited: 3");
  await expect(input).toHaveValue("");
  await slider.press("ArrowRight");
  const highlight = root.locator(".slider-ticks > span").first();
  const target = root.locator('.slider-ticks [data-value="1"]');
  await expect
    .poll(async () => {
      const [a, b] = await Promise.all([
        highlight.boundingBox(),
        target.boundingBox(),
      ]);
      return Math.abs(a!.x + a!.width / 2 - b!.x - b!.width / 2);
    })
    .toBeLessThan(0.2);
  await expect(highlight).not.toHaveAttribute("data-hidden");
  const start = (await highlight.boundingBox())!.x;
  await slider.press("ArrowRight");
  const during = (await highlight.boundingBox())!.x;
  await expect
    .poll(async () => (await highlight.boundingBox())!.x)
    .toBeGreaterThan(start);
  const target2 = root.locator('.slider-ticks [data-value="2"]');
  await expect
    .poll(async () => {
      const [a, b] = await Promise.all([
        highlight.boundingBox(),
        target2.boundingBox(),
      ]);
      return Math.abs(a!.x + a!.width / 2 - b!.x - b!.width / 2);
    })
    .toBeLessThan(0.2);
  expect(during).toBeLessThan((await highlight.boundingBox())!.x);
});
