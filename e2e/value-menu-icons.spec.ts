import { expect, test } from "@playwright/test";

test("section title icons are decorative and do not dismiss the menu", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=menus-features--title-icons&viewMode=story");
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
  await page.goto("/iframe.html?id=menus-features--value-icons&viewMode=story");
  const trigger = page.getByRole("combobox", { name: "Effort" });
  const anchorText = (await trigger.locator(".meta-value").boundingBox())!;
  const anchorIcon = (await trigger.locator("svg").boundingBox())!;
  expect(anchorIcon.x + anchorIcon.width).toBeLessThan(anchorText.x);
  await trigger.click();
  const menu = page.getByRole("listbox", { name: "Effort choices" });
  const current = page.locator(".setting-menu .setting-current");
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
    "/iframe.html?id=menus-features--searchable-icons&viewMode=story",
  );
  const trigger = page.getByRole("combobox", { name: "Effort", exact: true });
  const anchor = (await trigger.locator(".meta-value").boundingBox())!;
  const triggerBox = (await trigger.boundingBox())!;
  await trigger.click();
  const search = page.getByRole("combobox", { name: "Search Effort" });
  const searchBox = (await search.boundingBox())!;
  const row = (await search.locator("..").boundingBox())!;
  expect(row.width).toBe(triggerBox.width);
  expect(row.height).toBe(triggerBox.height);
  await expect(search).toHaveCSS("border-radius", "0px");
  await expect(search).toHaveValue("");
  await expect(search).toHaveAttribute("placeholder", "Medium");
  const selection = await search.evaluate((node: HTMLInputElement) => ({
    start: node.selectionStart,
    end: node.selectionEnd,
  }));
  expect(selection.start).toBe(0);
  expect(selection.end).toBe(0);
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

test("icon grids share selection and search while moving spatially around disabled choices", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-valuemenu--icon-grid&viewMode=story",
  );
  const trigger = page.getByRole("combobox", { name: "Symbol", exact: true });
  await expect(trigger.locator("svg")).toHaveCount(0);
  await trigger.click();
  const search = page.getByRole("combobox", { name: "Search Symbol" });
  await expect(search).toBeFocused();
  await expect(search.locator("..").locator("svg")).toHaveCount(0);
  const list = page.getByRole("listbox", { name: "Symbol choices" });
  await expect(list.getByRole("option")).toHaveCount(8);
  const circle = list.getByRole("option", { name: "Circle", exact: true });
  const square = list.getByRole("option", { name: "Square", exact: true });
  await search.press("ArrowDown");
  await expect(circle).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(square).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(
    list.getByRole("option", { name: "Diamond", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    list.getByRole("option", { name: "Ring", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Home");
  await expect(circle).toBeFocused();
  const bounds = await circle.evaluate((node) => {
    const icon = node.querySelector("svg")!.getBoundingClientRect();
    const label = node
      .querySelector(".setting-match-label")!
      .getBoundingClientRect();
    return {
      below: label.top >= icon.bottom,
      centered:
        Math.abs(label.left + label.width / 2 - icon.left - icon.width / 2) <
        0.1,
    };
  });
  expect(bounds).toEqual({ below: true, centered: true });
  await search.fill("hex");
  await expect(list.getByRole("option")).toHaveCount(1);
  await list.getByRole("option", { name: "Hexagon", exact: true }).click();
  await expect(list).toHaveCount(0);
  await expect(trigger).toHaveText("Hexagon");
});
