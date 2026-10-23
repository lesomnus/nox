import { expect, test } from "@playwright/test";

test("section title icons are decorative and do not dismiss the menu", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-valuemenu--title-icons&viewMode=story",
  );
  const trigger = page.getByRole("combobox", { name: "Effort" });
  await expect(trigger.locator("svg")).toHaveCount(0);
  await trigger.click();
  const menu = page.getByRole("listbox", { name: "Effort choices" });
  const quick = menu.getByRole("group", { name: "Quick", exact: true });
  await expect(quick.locator("svg")).toHaveCount(1);
  await expect(quick.locator('[aria-hidden="true"]')).toHaveCount(1);
  await quick.locator("svg").click();
  await expect(menu).toBeVisible();
  await expect(
    menu.getByRole("option", { name: "Medium", exact: true }),
  ).toBeFocused();
  await expect(
    menu.getByRole("option", { name: "Low", exact: true }).locator("svg"),
  ).toHaveCount(0);
});

test("value icons stay aligned with the selected trigger and follow selection", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-valuemenu--value-icons&viewMode=story",
  );
  const trigger = page.getByRole("combobox", { name: "Effort" });
  const anchorText = (await trigger.locator(".meta-value").boundingBox())!;
  const anchorIcon = (await trigger.locator("svg").boundingBox())!;
  expect(anchorIcon.x + anchorIcon.width).toBeLessThan(anchorText.x);
  await trigger.click();
  const menu = page.getByRole("listbox", { name: "Effort choices" });
  const current = menu.getByRole("option", { name: "Medium", exact: true });
  const currentText = (await current.locator(".meta-value").boundingBox())!;
  const currentIcon = (await current.locator("svg").boundingBox())!;
  expect(currentText.x).toBeCloseTo(anchorText.x, 0);
  expect(currentText.y).toBeCloseTo(anchorText.y, 0);
  expect(currentIcon.x).toBeCloseTo(anchorIcon.x, 0);
  expect(currentIcon.y).toBeCloseTo(anchorIcon.y, 0);
  await expect(
    menu.getByRole("option", { name: "Maximum", exact: true }),
  ).toBeDisabled();
  const high = menu.getByRole("option", { name: "High", exact: true });
  const path = await high.locator("path").getAttribute("d");
  await high.click();
  await expect(trigger).toHaveText("High");
  await expect(trigger.locator("path")).toHaveAttribute("d", path!);
});

test("search retains the current icon without shifting text or affecting matching", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-valuemenu--searchable-icons&viewMode=story",
  );
  const trigger = page.getByRole("combobox", { name: "Effort", exact: true });
  const anchor = (await trigger.locator(".meta-value").boundingBox())!;
  await trigger.click();
  const search = page.getByRole("combobox", { name: "Search Effort" });
  const searchBox = (await search.boundingBox())!;
  expect(searchBox.x).toBeCloseTo(anchor.x, 0);
  expect(searchBox.y).toBeCloseTo(anchor.y, 0);
  await expect(search.locator("..").locator("svg")).toHaveCount(1);
  await search.fill("hi");
  const list = page.getByRole("listbox", { name: "Effort choices" });
  await expect(list.getByRole("option")).toHaveCount(1);
  await expect(
    list.getByRole("option", { name: "High", exact: true }).locator("svg"),
  ).toHaveCount(1);
  await expect(
    list.getByRole("group", { name: "Deep", exact: true }).locator("svg"),
  ).toHaveCount(2);
  await search.press("Enter");
  await expect(trigger).toHaveText("High");
});
