import { expect, test } from "@playwright/test";

for (const kind of ["actions", "values", "search"] as const) {
  for (const height of [720, 360]) {
    test(`${kind} fixed regions stay visible through scrolling and preserve control focus at height ${height}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 800, height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(
        `/iframe.html?id=menus-features--${kind === "search" ? "fixed-search-regions" : "fixed-regions"}&viewMode=story`,
      );
      const trigger =
        kind === "actions"
          ? page.getByRole("button", { name: "Fixed actions", exact: true })
          : page.getByRole("combobox", { name: "Fixed values", exact: true });
      await trigger.click();
      const popup = page.locator(
        kind === "actions" ? ".action-menu-popup" : ".setting-menu",
      );
      const header = popup.locator('[data-menu-fixed="header"]');
      const footer = popup.locator('[data-menu-fixed="footer"]');
      await expect(header).toBeVisible();
      await expect(footer).toBeVisible();
      const before = {
        header: await header.boundingBox(),
        footer: await footer.boundingBox(),
      };
      const viewport = popup.locator('[data-scroll-area="viewport"]');
      await expect
        .poll(() =>
          viewport.evaluate((el) => el.scrollHeight > el.clientHeight),
        )
        .toBe(true);
      await viewport.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await expect
        .poll(() => viewport.evaluate((el) => el.scrollTop))
        .toBeGreaterThan(0);
      expect(await header.boundingBox()).toEqual(before.header);
      expect(await footer.boundingBox()).toEqual(before.footer);
      const bounds = (await popup.boundingBox())!;
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(height + 1);
      const toggle = popup.getByRole("button", {
        name: "Keep open toggle",
        exact: true,
      });
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await expect(popup).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await expect(toggle).toBeFocused();
      const input = popup.getByRole("textbox", { name: "Pinned filter" });
      await input.fill("Header text");
      await input.press("Home");
      await expect(input).toBeFocused();
      expect(
        await input.evaluate((el: HTMLInputElement) => el.selectionStart),
      ).toBe(0);
      await input.press("Escape");
      await expect(popup).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
  }
}
