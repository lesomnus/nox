import { expect, test } from "@playwright/test";

test("the selected choice is shown once in the list and reselecting it does not emit a change", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-valuemenu--selection-events&viewMode=story",
  );
  const trigger = page.getByRole("combobox", { name: "Effort", exact: true });
  const anchor = (await trigger.locator(".meta-value").boundingBox())!;
  await trigger.click();
  const list = page.getByRole("listbox", { name: "Effort choices" });
  const selected = list.locator('[role="option"][data-option-value="medium"]');
  await expect(selected).toHaveAttribute("aria-selected", "true");
  await expect(
    list.locator('[role="option"][aria-selected="true"]'),
  ).toHaveCount(1);
  await expect(selected).toBeFocused();
  const current = (await page
    .locator(".setting-menu .setting-current .meta-value")
    .boundingBox())!;
  expect(current.x).toBeCloseTo(anchor.x, 1);
  expect(current.y).toBeCloseTo(anchor.y, 1);
  await selected.click();
  await expect(list).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("status")).toHaveText("Changes: 0");
  await trigger.click();
  await list.getByRole("option", { name: "high", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Changes: 1");
  await expect(trigger).toHaveText("high");
});

test("hideSelected omits the choice while preserving the current-value overlay", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-valuemenu--hide-selected&viewMode=story",
  );
  const trigger = page.getByRole("combobox", { name: "Effort", exact: true });
  await trigger.click();
  const list = page.getByRole("listbox", { name: "Effort choices" });
  await expect(list.locator('[data-option-value="medium"]')).toHaveCount(0);
  await expect(list.getByRole("option")).toHaveCount(3);
  await expect(page.locator(".setting-menu .setting-current")).toHaveText(
    "medium",
  );
  await page.keyboard.press("End");
  await expect(
    list.getByRole("option", { name: "high", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("search includes matching selected values and Enter keeps the same value without a change callback", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-valuemenu--selection-events&viewMode=story&args=searchable:true",
  );
  const trigger = page.getByRole("combobox", { name: "Effort", exact: true });
  await trigger.click();
  const search = page.getByRole("combobox", { name: "Search Effort" });
  const list = page.getByRole("listbox", { name: "Effort choices" });
  await expect(list.getByRole("option")).toHaveCount(4);
  await search.fill("medium");
  await expect(list.locator('[data-option-value="medium"]')).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await search.fill("unknown");
  await expect(list.getByRole("status")).toHaveText("No matches");
  await search.fill("low");
  await search.press("Enter");
  await expect(trigger).toHaveText("low");
  await expect(page.getByRole("status")).toHaveText("Changes: 1");
  await trigger.click();
  await search.fill("low");
  await search.press("Enter");
  await expect(list).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Changes: 1");
});

test("hideSelected applies to filtered search and removes selected-only groups", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-valuemenu--searchable-hide-selected&viewMode=story",
  );
  await page.getByRole("combobox", { name: "Effort", exact: true }).click();
  const list = page.getByRole("listbox", { name: "Effort choices" });
  await page.getByRole("combobox", { name: "Search Effort" }).fill("med");
  await expect(list.locator('[data-option-value="medium"]')).toHaveCount(0);
  await expect(list.getByRole("option")).toHaveCount(1);
  await page.goto(
    "/iframe.html?id=components-valuemenu--empty-sections&viewMode=story&args=hideSelected:true",
  );
  await page.getByRole("combobox", { name: "Effort", exact: true }).click();
  await expect(list.getByRole("group", { name: "Current" })).toHaveCount(0);
  await expect(list.getByRole("group", { name: "Remaining" })).toBeVisible();
  await expect(list.getByRole("separator")).toHaveCount(0);
});

test("prefix wrappers forward the selected visibility flag", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-prefixvaluemenu--hide-selected&viewMode=story",
  );
  const trigger = page.getByRole("combobox");
  const value = await trigger.locator("..").getAttribute("data-value");
  await trigger.click();
  await expect(
    page.getByRole("listbox").locator(`[data-option-value="${value}"]`),
  ).toHaveCount(0);
});
