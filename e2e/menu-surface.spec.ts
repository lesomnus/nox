import { expect, test } from "@playwright/test";

for (const kind of ["action", "value"] as const) {
  test(`${kind} menu stays interactive inside the nearest native dialog`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-${kind}menu--${kind === "action" ? "more" : "default"}&viewMode=story`,
    );
    const trigger =
      kind === "action"
        ? page.getByRole("button", { name: "More", exact: true })
        : page.getByRole("combobox", { name: "Effort", exact: true });
    await expect(trigger).toBeVisible();
    await page.evaluate(() => {
      const dialog = document.createElement("dialog");
      const content = document.querySelector(".ui-showcase")!;
      content.parentElement!.append(dialog);
      dialog.append(content);
      dialog.showModal();
    });
    await trigger.click();
    const menu = page.getByRole(kind === "action" ? "menu" : "listbox");
    await expect(menu).toBeVisible();
    expect(await menu.evaluate((node) => node.parentElement?.tagName)).toBe(
      "DIALOG",
    );
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator("dialog")).toBeVisible();
    await trigger.click();
    await menu
      .getByRole(kind === "action" ? "menuitem" : "option", {
        name: kind === "action" ? "Details" : "high",
        exact: true,
      })
      .click();
    await expect(menu).toHaveCount(0);
    if (kind === "value") await expect(trigger).toHaveText("high");
    await expect(trigger).toBeFocused();
  });
}
