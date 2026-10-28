import { expect, test } from "@playwright/test";

for (const theme of ["dark", "light"]) {
  test(`form controls match Editable description geometry in ${theme}`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-descriptionlist--editable&viewMode=story&globals=theme:${theme}`,
    );
    const expected = await page.locator("dl").evaluate((root) => {
      const box = root.getBoundingClientRect();
      const term = root.querySelector("dt")!;
      const control = root.querySelector("dd button")!;
      const bounds = control.getBoundingClientRect();
      return {
        x: bounds.x - box.x,
        y: bounds.y - box.y,
        width: bounds.width,
        height: bounds.height,
        font: getComputedStyle(control).font,
        labelFont: getComputedStyle(term).font,
        gap: getComputedStyle(root).gap,
      };
    });
    await page.goto(
      `/iframe.html?id=components-form--default&viewMode=story&globals=theme:${theme}`,
    );
    const form = page.getByRole("form", { name: "Workspace form" });
    const actual = await form.evaluate((root) => {
      const box = root.getBoundingClientRect();
      const term = root.querySelector("label")!;
      const control = root.querySelector("input")!;
      const bounds = control.getBoundingClientRect();
      return {
        x: bounds.x - box.x,
        y: bounds.y - box.y,
        width: bounds.width,
        height: bounds.height,
        font: getComputedStyle(control).font,
        labelFont: getComputedStyle(term).font,
        gap: getComputedStyle(root).gap,
      };
    });
    expect(actual).toEqual(expected);
    const name = page.getByRole("textbox", { name: "Name", exact: true });
    const background = await name.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(background).not.toBe("rgba(0, 0, 0, 0)");
    await page.mouse.move(0, 0);
    await expect(name).toHaveCSS("background-color", background);
    await form.locator("label").first().click();
    await expect(name).toBeFocused();
    await name.fill("Updated workspace");
    await name.press("Tab");
    await expect(
      page.getByRole("textbox", { name: "State", exact: true }),
    ).toBeFocused();
  });
}

test("card forms share control heights, keep metadata first and submit native fields", async ({
  page,
}, testInfo) => {
  await page.goto("/iframe.html?id=components-form--in-card&viewMode=story");
  const priority = page.getByRole("combobox", {
    name: "Priority",
    exact: true,
  });
  const status = page.getByRole("combobox", { name: "Status", exact: true });
  const name = page.getByRole("textbox", { name: "Name", exact: true });
  const left = (await priority.boundingBox())!;
  const right = (await status.boundingBox())!;
  const input = (await name.boundingBox())!;
  expect(left.y).toBe(right.y);
  expect(left.width).toBe(right.width);
  expect(left.height).toBe(input.height);
  expect(right.x).toBeGreaterThan(left.x + left.width);
  expect(input.y).toBeGreaterThan(left.y + left.height);
  await page.screenshot({ path: testInfo.outputPath("form-in-card.png") });
  await priority.click();
  await page.getByRole("option", { name: "High", exact: true }).click();
  await name.fill("Updated workspace");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByLabel("Saved values")).toContainText(
    '"name":"Updated workspace"',
  );
  await expect(page.getByLabel("Saved values")).toContainText(
    '"priority":"high"',
  );
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(name).toHaveValue("My workspace");
  await expect(priority).toHaveText("Normal");
});
