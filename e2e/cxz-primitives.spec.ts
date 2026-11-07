import { expect, test } from "@playwright/test";

test("ImageViewer fits, uses source pixels at 100%, pans and resets", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-imageviewer--default&viewMode=story",
  );
  const image = page.getByRole("img", { name: "Transparent illustration" });
  await expect(image).toBeVisible();
  const viewport = page.locator("[data-image-viewport]");
  const box = (await viewport.boundingBox())!;
  const fit = (await image.boundingBox())!;
  expect(fit.width).toBeLessThanOrEqual(box.width + 1);
  expect(fit.height).toBeLessThanOrEqual(box.height + 1);
  const slider = page.getByRole("slider", { name: "Image zoom" });
  await slider.fill("100");
  await expect.poll(async () => (await image.boundingBox())!.width).toBe(1600);
  await expect(viewport).toHaveAttribute("data-can-pan", "true");
  await viewport.focus();
  await viewport.press("ArrowRight");
  await expect
    .poll(async () => (await image.boundingBox())!.x)
    .toBeCloseTo(box.x + box.width / 2 - 800 + 32, 1);
  await viewport.press("Home");
  await expect
    .poll(async () => (await image.boundingBox())!.x)
    .toBeCloseTo(box.x + box.width / 2 - 800, 1);
});

test("ImageViewer recovers from a failed Blob loader", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=components-imageviewer--load-and-retry&viewMode=story",
  );
  await expect(page.getByRole("alert")).toHaveText(
    "The image could not be loaded.",
  );
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Loaded illustration" }),
  ).toBeVisible();
});

test("Tabs wrap keyboard focus and skip disabled items", async ({ page }) => {
  await page.goto("/iframe.html?id=components-tabs--default&viewMode=story");
  const first = page.getByRole("tab", { name: "First" }),
    second = page.getByRole("tab", { name: "Second" });
  await first.focus();
  await first.press("ArrowRight");
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute("aria-selected", "true");
  await second.press("ArrowRight");
  await expect(first).toBeFocused();
  await first.press("End");
  await expect(second).toBeFocused();
  await second.press("Home");
  await expect(first).toBeFocused();
  await page
    .getByRole("tablist")
    .evaluate((node) => node.setAttribute("dir", "rtl"));
  await first.press("ArrowLeft");
  await expect(second).toBeFocused();
});

test("FindBar delegates search options and closes only through explicit close", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=components-findbar--default&viewMode=story");
  const search = page.getByRole("search");
  const input = page.getByRole("searchbox");
  await expect(search.getByRole("status")).toHaveAttribute(
    "aria-label",
    "Result 1 of 3",
  );
  await page.getByRole("button", { name: "Match case", exact: true }).click();
  await expect(search.getByRole("status")).toHaveAttribute(
    "aria-label",
    "Result 1 of 2",
  );
  await input.press("Enter");
  await expect(search.getByRole("status")).toHaveAttribute(
    "aria-label",
    "Result 2 of 2",
  );
  await page.mouse.click(900, 500);
  await expect(search).toBeVisible();
  await page
    .getByRole("button", { name: "Use regular expression", exact: true })
    .click();
  await input.fill("[");
  await expect(search.getByRole("alert")).toBeVisible();
  await input.press("Escape");
  await expect(search).toHaveCount(0);
  await page.getByRole("button", { name: "Open search" }).click();
  await expect(search).toBeVisible();
  await page.getByRole("button", { name: "Close search" }).click();
  await expect(search).toHaveCount(0);
});

test("ActivityHeatmap preserves selected dates and calendar placement", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-activityheatmap--sparse&viewMode=story",
  );
  const first = page.getByRole("button", {
    name: "Activity day 1",
    exact: true,
  });
  await expect(page.locator('[data-date="2026-08-16"] button')).toHaveAttribute(
    "aria-label",
    "Activity day 1",
  );
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Activity day 5", exact: true })
    .click();
  await expect(first).toHaveAttribute("aria-pressed", "false");
});

test("PathValue copies full paths while eliding and exposes a full in-place value", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(
    "/iframe.html?id=components-pathvalue--default&viewMode=story",
  );
  const button = page.getByRole("button", { name: "Copy file path" });
  await expect(button).toBeVisible();
  const text = await button.innerText();
  expect(text).toContain("configuration.json");
  expect(text).not.toContain("packages/client");
  await button.hover();
  await expect(page.getByRole("tooltip")).toContainText(
    "/home/alex/workspaces/repository/packages/client/src/configuration.json",
  );
  await button.click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(
      "/home/alex/workspaces/repository/packages/client/src/configuration.json",
    );
});

test("LiquidGauge keeps unknown and full values in the same frame", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-liquidgauge--levels&viewMode=story",
  );
  const meters = page.getByRole("meter");
  await expect(meters).toHaveCount(6);
  await expect(meters.first()).toHaveAttribute("aria-valuenow", "100");
  await expect(meters.last()).toHaveAttribute("aria-valuenow", "0");
  const paths = page.locator("[data-liquid-contour]");
  await expect(paths).toHaveCount(7);
  for (const path of await paths.all())
    expect(await path.getAttribute("d")).not.toMatch(/NaN|Infinity/);
  const frames = await page
    .locator("[data-liquid-vessel]")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height),
    );
  expect(new Set(frames).size).toBe(1);
});

test("ListDetailPages retains exit content then starts a fresh detail editor", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-listdetailpages--default&viewMode=story",
  );
  await page.getByRole("button", { name: "Open detail" }).click();
  const input = page.getByRole("textbox", { name: "Draft" });
  await input.fill("Discarded draft");
  await page.getByRole("button", { name: "Close detail" }).click();
  const old = page.locator('[data-sliding-page="detail"] input');
  await expect(old).toHaveValue("Discarded draft");
  await page.getByRole("button", { name: "Open detail" }).click();
  await expect(input).toHaveValue("");
  await page.getByRole("button", { name: "Close detail" }).click();
  await expect(old).toHaveCount(0);
});
