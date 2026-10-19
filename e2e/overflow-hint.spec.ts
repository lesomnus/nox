import { expect, test } from "@playwright/test";

for (const scale of [1, 1.25, 1.5, 2]) {
  test.describe(`in-place hint at device scale ${scale}`, () => {
    test.use({ deviceScaleFactor: scale });
    test("paints one complete surface without exposing the original edges", async ({
      page,
    }) => {
      await page.goto(
        "/iframe.html?id=components-overflowhint--in-place&viewMode=story",
      );
      await page.evaluate(() => document.fonts.ready);
      const anchor = page.locator("[tabindex='0']");
      const before = (await anchor.boundingBox())!;
      await anchor.hover();
      const hint = page.getByRole("tooltip");
      await expect(hint).toHaveText("1a2b3c4d-5e6f-7788-9900-aabbccddeeff");
      expect(await anchor.boundingBox()).toEqual(before);
      await expect(hint).toHaveCSS("clip-path", "none");
      const frame = (await hint.boundingBox())!;
      const clip = {
        x: Math.max(0, frame.x - 12),
        y: Math.max(0, frame.y - 12),
        width: frame.width + 24,
        height: frame.height + 24,
      };
      const actual = await page.screenshot({ clip });
      // Even a conspicuous source outline must not bleed through or around the overlay.
      await anchor.evaluate((element) => {
        element.style.outline = "8px solid magenta";
        element.style.background = "magenta";
      });
      expect(await page.screenshot({ clip })).toEqual(actual);
      await page.mouse.move(0, 0);
      await expect(hint).toHaveCount(0);
      await anchor.evaluate((element) => {
        element.style.outline = "";
        element.style.background = "";
      });
      await anchor.focus();
      await expect(hint).toBeVisible();
      await anchor.press("Escape");
      await expect(hint).toHaveCount(0);
      await expect(anchor).toBeFocused();
      await expect(anchor).toHaveCSS("opacity", "1");
    });
  });
}
