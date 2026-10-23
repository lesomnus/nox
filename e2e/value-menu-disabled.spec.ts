import { expect, test } from "@playwright/test";

for (const height of [720, 240]) {
  test(`disabled options reject clicks and are skipped by keyboard at viewport height ${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 600, height });
    await page.goto(
      "/iframe.html?id=components-valuemenu--disabled-options&viewMode=story",
    );
    const trigger = page.getByRole("combobox", { name: "Effort" });
    await trigger.click();
    const menu = page.getByRole("listbox", { name: "Effort choices" });
    await expect(menu.getByText("Quick", { exact: true })).toHaveCSS(
      "font-size",
      "10px",
    );
    const low = menu.getByRole("option", { name: "Low", exact: true });
    await expect(low).toBeDisabled();
    await expect(low).toHaveCSS("opacity", "0.4");
    await low.scrollIntoViewIfNeeded();
    const box = (await low.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveText("Medium");
    await expect(menu.getByRole("option", { name: "Medium" })).toBeFocused();

    for (const name of ["Balanced", "High", "Medium"]) {
      await page.keyboard.press("ArrowDown");
      await expect(
        menu.getByRole("option", { name, exact: true }),
      ).toBeFocused();
    }
    for (const name of ["High", "Balanced", "Medium"]) {
      await page.keyboard.press("ArrowUp");
      await expect(
        menu.getByRole("option", { name, exact: true }),
      ).toBeFocused();
    }
    const opensUp = await menu.evaluate((node) =>
      node.classList.contains("opens-up"),
    );
    await page.keyboard.press("Home");
    await expect(
      menu.getByRole("option", { name: opensUp ? "Balanced" : "Medium" }),
    ).toBeFocused();
    await page.keyboard.press("End");
    await expect(
      menu.getByRole("option", { name: opensUp ? "Medium" : "High" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });
}

test("search Enter selects the first enabled match and keeps disabled-only results open", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-valuemenu--searchable-disabled-options&viewMode=story",
  );
  const trigger = page.getByRole("combobox", { name: "Effort", exact: true });
  await trigger.click();
  const search = page.getByRole("combobox", { name: "Search Effort" });
  await search.fill("");
  await search.press("Enter");
  await expect(trigger).toHaveText("Balanced");

  await trigger.click();
  await search.fill("maximum");
  const list = page.getByRole("listbox", { name: "Effort choices" });
  await expect(list.getByRole("option", { name: "Maximum" })).toBeDisabled();
  await search.press("Enter");
  await expect(list).toBeVisible();
  await expect(trigger).toHaveText("Balanced");
  await search.press("ArrowDown");
  await expect(search).toBeFocused();
  await search.fill("high");
  await search.press("ArrowDown");
  await expect(list.getByRole("option", { name: "High" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveText("High");
});

test("a disabled current value still allows choosing an available option", async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 240 });
  await page.goto(
    "/iframe.html?id=components-valuemenu--disabled-options&viewMode=story&args=value:maximum",
  );
  const trigger = page.getByRole("combobox", { name: "Effort" });
  await expect(trigger).toBeEnabled();
  await expect(trigger).toHaveText("Maximum");
  await trigger.click();
  const menu = page.getByRole("listbox", { name: "Effort choices" });
  await expect(menu.getByRole("option", { name: "Maximum" })).toBeDisabled();
  await expect(menu.getByRole("option", { name: "Balanced" })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(menu.getByRole("option", { name: "Balanced" })).toBeFocused();
  await page.keyboard.press("End");
  await expect(menu.getByRole("option", { name: "High" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveText("High");
});
