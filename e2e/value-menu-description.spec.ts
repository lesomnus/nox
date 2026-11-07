import { expect, test } from "@playwright/test";

test("two-line choices preserve the selected name, alias and leading icon geometry", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-valuemenu--descriptions&viewMode=story",
  );
  const trigger = page.getByRole("combobox", {
    name: "Workspace",
    exact: true,
  });
  const label = trigger.locator(".meta-value");
  await expect(label.locator("small")).toHaveText("atlas");
  await expect(label.locator("small")).toHaveCSS("font-size", "10px");
  const textBox = (await label.boundingBox())!;
  const iconBox = (await trigger.locator("svg").boundingBox())!;
  const triggerBox = (await trigger.boundingBox())!;
  expect(triggerBox.height).toBeGreaterThan(32);
  expect(iconBox.x + iconBox.width).toBeLessThan(textBox.x);
  await trigger.click();
  const selected = page.getByRole("option", {
    name: "Atlas workspace atlas",
    exact: true,
  });
  const actual = (await selected
    .locator(".setting-match-label")
    .boundingBox())!;
  const actualIcon = (await selected.locator("svg").boundingBox())!;
  expect(actual.x).toBeCloseTo(textBox.x, 0);
  expect(actual.y).toBeCloseTo(textBox.y, 0);
  expect(actual.height).toBe(32);
  expect(actualIcon.x).toBeCloseTo(iconBox.x, 0);
  expect(actualIcon.y).toBeCloseTo(iconBox.y, 0);
  const other = page.getByRole("option", {
    name: "Sandbox preview sandbox",
    exact: true,
  });
  expect((await other.boundingBox())!.height).toBeGreaterThan(32);
  await other.click();
  await expect(trigger.locator("small")).toHaveText("sandbox");
  await expect(trigger.locator("svg path")).toHaveCount(1);
  expect((await trigger.boundingBox())!.height).toBe(triggerBox.height);
});

test("description matches highlight on their own line and keep keyboard selection", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-valuemenu--searchable-descriptions&viewMode=story",
  );
  await page.getByRole("combobox", { name: "Workspace", exact: true }).click();
  const search = page.getByRole("combobox", {
    name: "Search Workspace",
    exact: true,
  });
  // A query spanning the label and alias must keep both lines and highlight both.
  await search.fill("preview sandbox");
  const list = page.getByRole("listbox", {
    name: "Workspace choices",
    exact: true,
  });
  await expect(list.getByRole("option")).toHaveCount(1);
  const option = list.getByRole("option");
  await expect(option.locator("small")).toHaveText("sandbox");
  await expect(option.locator("small mark")).toHaveText("sandbox");
  await expect(option.locator(".setting-match-label > span mark")).toHaveText(
    "preview",
  );
  await search.press("Enter");
  await expect(
    page
      .getByRole("combobox", { name: "Workspace", exact: true })
      .locator("small"),
  ).toHaveText("sandbox");
});
