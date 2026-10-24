import { expect, test } from "@playwright/test";

test("section titles and item dividers do not interrupt selection or anchor alignment", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=menus-features--sections&viewMode=story");
  const trigger = page.getByRole("combobox", { name: "Effort" });
  await expect(trigger).toHaveText("Medium");
  const anchor = (await trigger.locator(".meta-value").boundingBox())!;
  await trigger.click();
  const menu = page.getByRole("listbox", { name: "Effort choices" });
  await expect(menu.getByRole("group", { name: "Quick" })).toContainText("Low");
  await expect(menu.getByRole("group", { name: "Deep" })).toContainText(
    "Maximum",
  );
  await expect(menu.getByRole("separator")).toHaveCount(3);
  await menu.getByText("Quick", { exact: true }).click();
  await expect(menu).toBeVisible();
  await menu.getByRole("separator").nth(1).click();
  await expect(menu).toBeVisible();
  const current = menu.getByRole("option", { name: "Medium", exact: true });
  const aligned = (await current.locator(".meta-value").boundingBox())!;
  expect(aligned.x).toBeCloseTo(anchor.x, 0);
  expect(aligned.y).toBeCloseTo(anchor.y, 0);
  await page.keyboard.press("End");
  await expect(menu.getByRole("option", { name: "Maximum" })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(menu.getByRole("option", { name: "High" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveText("High");
  await expect(menu).toHaveCount(0);
});

test("upward sections count header/divider heights and keep keyboard choices in view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 240 });
  await page.goto("/iframe.html?id=menus-features--sections&viewMode=story");
  await page.getByRole("combobox", { name: "Effort" }).click();
  const menu = page.getByRole("listbox", { name: "Effort choices" });
  await expect(menu).toHaveClass(/opens-up/);
  const bounds = (await menu.boundingBox())!;
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(240);
  await page.keyboard.press("ArrowUp");
  const maximum = menu.getByRole("option", { name: "Maximum" });
  await expect(maximum).toBeFocused();
  await expect(maximum).toBeInViewport();
  await page.keyboard.press("Home");
  const low = menu.getByRole("option", { name: "Low", exact: true });
  await expect(low).toBeFocused();
  await expect(low).toBeInViewport();
});

test("search hides empty sections and orphan dividers before selecting a result", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=menus-features--searchable-sections&viewMode=story",
  );
  const trigger = page.getByRole("combobox", { name: "Effort", exact: true });
  await trigger.click();
  const search = page.getByRole("combobox", { name: "Search Effort" });
  const list = page.getByRole("listbox", { name: "Effort choices" });
  await search.fill("hi");
  await expect(list.getByRole("group", { name: "Quick" })).toHaveCount(0);
  await expect(list.getByRole("group", { name: "Deep" })).toBeVisible();
  await expect(list.getByRole("separator")).toHaveCount(0);
  await expect(list.getByRole("option")).toHaveCount(1);
  await search.fill("missing");
  await expect(list.getByRole("group")).toHaveCount(0);
  await expect(list.getByRole("status")).toHaveText("No matches");
  await search.fill("hi");
  await search.press("Enter");
  await expect(trigger).toHaveText("High");
});

test("flat options support dividers without section headings", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-valuemenu--separators&viewMode=story",
  );
  await page.getByRole("combobox", { name: "Effort" }).click();
  const menu = page.getByRole("listbox", { name: "Effort choices" });
  await expect(menu.getByRole("separator")).toHaveCount(2);
  await menu.getByRole("option", { name: "Maximum" }).click();
  await expect(page.getByRole("combobox", { name: "Effort" })).toHaveText(
    "Maximum",
  );
});

test("empty and selected-only sections leave no header or leading divider", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-valuemenu--empty-sections&viewMode=story",
  );
  await page.getByRole("combobox", { name: "Effort" }).click();
  const menu = page.getByRole("listbox", { name: "Effort choices" });
  await expect(menu.getByRole("group")).toHaveCount(1);
  await expect(menu.getByRole("group", { name: "Remaining" })).toBeVisible();
  await expect(menu.getByRole("separator")).toHaveCount(1);
});
