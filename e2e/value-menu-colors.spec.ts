import { expect, test } from "@playwright/test";

for (const theme of ["dark", "light"]) {
  test(`portaled ValueMenu uses ${theme} text colors independently of the body`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-valuemenu--default&viewMode=story&globals=theme:${theme}`,
    );
    // Consumers need no document reset: a portal must own its foreground.
    await page.addStyleTag({ content: "body { color: #000; }" });
    const trigger = page.getByRole("combobox", { name: "Effort" });
    await trigger.click();
    await page.mouse.move(0, 0);
    const menu = page.getByRole("listbox", { name: "Effort choices" });
    const normal = menu.getByRole("option", { name: "high", exact: true });
    await expect(normal).toHaveCSS(
      "color",
      theme === "dark" ? "rgb(237, 237, 237)" : "rgb(18, 18, 18)",
    );
    await expect(
      menu.locator('[role="option"][data-muted="true"]'),
    ).not.toHaveCSS(
      "color",
      await normal.evaluate((node) => getComputedStyle(node).color),
    );
    await normal.click();
    await expect(trigger).toHaveText("high");
    await expect(menu).toHaveCount(0);
  });
}
