import { expect, test } from "@playwright/test";

for (const theme of ["dark", "light"]) {
  test(`form controls use creation padding and preserve radius-aligned labels in ${theme}`, async ({
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
        width: bounds.width,
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
      const label = term.getBoundingClientRect();
      const style = getComputedStyle(control);
      return {
        x: bounds.x - box.x,
        width: bounds.width,
        height: bounds.height,
        font: style.font,
        labelFont: getComputedStyle(term).font,
        gap: getComputedStyle(root).gap,
        padding: style.padding,
        radius: parseFloat(style.borderTopLeftRadius),
        labelInset: label.left - bounds.left,
        labelGap: bounds.top - label.bottom,
        border: style.borderWidth,
      };
    });
    expect(actual.font).toBe(expected.font);
    expect(actual.labelFont).toBe(expected.labelFont);
    expect(actual.gap).toBe(expected.gap);
    expect(actual.width).toBe(expected.width);
    expect(actual.x).toBe(0);
    expect(actual.padding).toBe("12px");
    expect(actual.radius).toBe(10);
    expect(actual.labelInset).toBe(actual.radius);
    expect(actual.labelGap).toBe(4);
    expect(actual.border).toBe("0px");
    expect(actual.height).toBe(42);
    const name = page.getByRole("textbox", { name: "Name", exact: true });
    const background = await name.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(background).not.toBe("rgba(0, 0, 0, 0)");
    expect(background).toBe(
      theme === "dark" ? "rgb(17, 17, 17)" : "rgb(251, 251, 251)",
    );
    await page.mouse.move(0, 0);
    await expect(name).toHaveCSS("background-color", background);
    await form.locator("label").first().click();
    await expect(name).toBeFocused();
    await name.fill("Updated workspace");
    await name.press("Tab");
    await expect(
      page.getByRole("textbox", { name: "State", exact: true }),
    ).toBeFocused();
    await expect(
      page.getByRole("textbox", { name: "State", exact: true }),
    ).toHaveCSS("outline-width", "2px");
    await expect(
      page.getByRole("textbox", { name: "State", exact: true }),
    ).toHaveCSS("outline-offset", "2px");

    await form.evaluate((root) =>
      root.style.setProperty("--ui-form-control-radius", "16px"),
    );
    const customized = await form.evaluate((root) => {
      const label = root.querySelector("label")!.getBoundingClientRect();
      const input = root.querySelector("input")!.getBoundingClientRect();
      return {
        inset: label.left - input.left,
        x: input.left - root.getBoundingClientRect().left,
        width: input.width,
      };
    });
    expect(customized).toEqual({ inset: 16, x: 0, width: actual.width });
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
  for (const trigger of [priority, status]) {
    const anchor = (await trigger.locator(".meta-value").boundingBox())!;
    await trigger.click();
    const popup = page.locator(".setting-menu");
    await expect(popup).toHaveAttribute("data-item-alignment", "selected");
    const selected = popup.locator(
      '[aria-selected="true"] .setting-match-label',
    );
    await expect
      .poll(async () => {
        const box = (await selected.boundingBox())!;
        return Math.max(
          Math.abs(box.x - anchor.x),
          Math.abs(box.y + box.height / 2 - anchor.y - anchor.height / 2),
        );
      })
      .toBeLessThan(0.5);
    await page.keyboard.press("Escape");
  }
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
