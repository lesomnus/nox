import { expect, test } from "@playwright/test";

test("compact icon segments retain native radio labels, keyboard behavior and stable geometry", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-segmentedcontrol--compact-icons&viewMode=story",
  );
  const group = page.getByRole("radiogroup", { name: "Tab input" });
  const tab = group.getByRole("radio", { name: "Tab character" });
  const spaces = group.getByRole("radio", { name: "Spaces", exact: true });
  await expect(spaces).toBeChecked();
  await expect(group.locator("svg")).toHaveCount(2);
  await expect(group).toHaveText("");
  await expect(group.locator("label").first()).toHaveAttribute(
    "title",
    "Tab character",
  );
  const before = await group.boundingBox();
  expect(before!.height).toBe(24);
  expect(before!.width).toBe(60);
  await tab.click();
  await expect(tab).toBeChecked();
  await expect(spaces).not.toBeChecked();
  await tab.press("ArrowRight");
  await expect(spaces).toBeFocused();
  await expect(spaces).toBeChecked();
  expect(await group.boundingBox()).toEqual(before);
});

test("default text sizing and disabled native controls remain available", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-segmentedcontrol--default&viewMode=story",
  );
  const group = page.getByRole("radiogroup", { name: "Theme" });
  await expect(
    group.getByRole("radio", { name: "Dark", exact: true }),
  ).toBeChecked();
  expect((await group.boundingBox())!.height).toBe(34);
  await expect(group).toContainText("System");
  await page.goto(
    "/iframe.html?id=components-segmentedcontrol--disabled&viewMode=story",
  );
  await expect(group.getByRole("radio")).toHaveCount(3);
  for (const radio of await group.getByRole("radio").all()) {
    await expect(radio).toBeDisabled();
  }
});
