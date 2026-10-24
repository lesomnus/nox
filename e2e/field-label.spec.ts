import { expect, test, type Locator } from "@playwright/test";

const story = (name: string, args = "") =>
  `/iframe.html?id=components-fieldlabel--${name}&viewMode=story${args ? `&args=${args}` : ""}`;
async function frame(locator: Locator) {
  return (await locator.boundingBox())!;
}

test("default help aligns its bottom-left corner above the icon and remains keyboard accessible", async ({
  page,
}) => {
  await page.goto(story("with-help"));
  const icon = page.getByRole("img", { name: "About Provisioning" });
  const anchor = icon.locator("..");
  const before = await frame(icon);
  await anchor.focus();
  const hint = page.getByRole("tooltip");
  await expect(hint).toBeVisible();
  await expect(hint).toHaveAttribute("data-placement", "top-start");
  const box = await frame(hint);
  expect(box.x).toBeCloseTo(before.x, 1);
  expect(before.y - box.y - box.height).toBeCloseTo(8, 1);
  expect(await frame(icon)).toEqual(before);
  expect(await anchor.getAttribute("aria-describedby")).toBe(
    await hint.getAttribute("id"),
  );
  expect(await hint.evaluate((el) => el.parentElement === document.body)).toBe(
    true,
  );
  await anchor.press("Escape");
  await expect(hint).toHaveCount(0);
  await expect(anchor).toBeFocused();
});

for (const placement of [
  "top",
  "top-end",
  "bottom-start",
  "bottom",
  "bottom-end",
  "left-start",
  "left",
  "left-end",
  "right-start",
  "right",
  "right-end",
]) {
  test(`helpPlacement=${placement} positions and aligns against the icon`, async ({
    page,
  }) => {
    await page.goto(story("with-help", `helpPlacement:${placement}`));
    // A central anchor leaves room on all four sides, so the requested position fits.
    await page.locator(".ui-showcase").evaluate((el) => {
      el.style.width = "auto";
    });
    await page.getByRole("img", { name: "About Provisioning" }).waitFor();
    const anchor = page
      .getByRole("img", { name: "About Provisioning" })
      .locator("..");
    await anchor.evaluate((el) => {
      el.style.position = "fixed";
      el.style.left = "630px";
      el.style.top = "350px";
    });
    await anchor.hover();
    const hint = page.getByRole("tooltip");
    await expect(hint).toHaveAttribute("data-placement", placement);
    await expect(hint).toBeVisible();
    const icon = await frame(anchor),
      box = await frame(hint);
    const [side, align = "center"] = placement.split("-");
    if (side === "top" || side === "bottom") {
      expect(
        side === "top"
          ? icon.y - box.y - box.height
          : box.y - icon.y - icon.height,
      ).toBeCloseTo(8, 1);
      expect(
        align === "start"
          ? box.x - icon.x
          : align === "end"
            ? box.x + box.width - icon.x - icon.width
            : box.x + box.width / 2 - icon.x - icon.width / 2,
      ).toBeCloseTo(0, 1);
    } else {
      expect(
        side === "left"
          ? icon.x - box.x - box.width
          : box.x - icon.x - icon.width,
      ).toBeCloseTo(8, 1);
      expect(
        align === "start"
          ? box.y - icon.y
          : align === "end"
            ? box.y + box.height - icon.y - icon.height
            : box.y + box.height / 2 - icon.y - icon.height / 2,
      ).toBeCloseTo(0, 1);
    }
  });
}

test("viewport edges flip above/below and shift wide help into a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 240 });
  await page.goto(story("viewport-edges"));
  const top = page.getByRole("img", { name: "About Top edge" }).locator("..");
  await top.focus();
  const hint = page.getByRole("tooltip");
  await expect(hint).toBeVisible();
  const icon = await frame(top),
    below = await frame(hint);
  expect(below.y).toBeGreaterThanOrEqual(icon.y + icon.height);
  expect(below.x).toBeGreaterThanOrEqual(8);
  expect(below.x + below.width).toBeLessThanOrEqual(312);
  await top.press("Escape");
  const bottom = page
    .getByRole("img", { name: "About Bottom edge" })
    .locator("..");
  await bottom.focus();
  await expect(hint).toBeVisible();
  const above = await frame(hint),
    bottomIcon = await frame(bottom);
  expect(above.y + above.height).toBeLessThan(bottomIcon.y);
  expect(above.x).toBeGreaterThanOrEqual(8);
  expect(above.x + above.width).toBeLessThanOrEqual(312);
  await page.setViewportSize({ width: 330, height: 240 });
  await expect(hint).toHaveCount(0);
});

test("plain labels have no Help focus stop and old adjacent hints still prefer below", async ({
  page,
}) => {
  await page.goto(story("plain"));
  await expect(page.getByRole("img")).toHaveCount(0);
  await expect(page.locator('[tabindex="0"]')).toHaveCount(0);
  await page.goto(
    "/iframe.html?id=components-overflowhint--adjacent&viewMode=story",
  );
  const anchor = page.locator('[tabindex="0"]');
  await anchor.hover();
  const hint = page.getByRole("tooltip");
  await expect(hint).toHaveAttribute("data-placement", "adjacent");
  await expect(hint).toBeVisible();
  const box = await frame(hint),
    icon = await frame(anchor);
  expect(box.y).toBeGreaterThan(icon.y + icon.height);
});
