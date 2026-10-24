import { expect, test } from "@playwright/test";

for (const height of [720, 240]) {
  test(`ActionMenu shares ScrollArea wheel, drag, keyboard and fades at height ${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 600, height });
    await page.goto("/iframe.html?id=menus-features--scrolling&viewMode=story");
    const trigger = page.getByRole("button", {
      name: "Preset actions",
      exact: true,
    });
    await trigger.click();
    const menu = page.getByRole("menu", {
      name: "Preset actions",
      exact: true,
    });
    const area = menu.locator('[data-scroll-area="root"]');
    const viewport = area.locator('[data-scroll-area="viewport"]');
    const thumb = area.getByRole("scrollbar", {
      name: "Scroll Preset actions",
    });
    const handle = area.locator('[data-scroll-area="handle"]');
    const rail = area.locator('[data-scroll-area="rail"]');
    const topFade = area.locator(':scope > [aria-hidden="true"]').first();
    await expect(thumb).toBeVisible();
    await expect(menu).toHaveCSS("overflow", "hidden");
    await expect(viewport).toHaveCSS("scrollbar-width", "none");
    const bounds = (await menu.boundingBox())!;
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(height);
    await viewport.hover();
    await page.mouse.wheel(0, 300);
    await expect
      .poll(() => viewport.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(0);
    await expect(topFade).toHaveCSS("opacity", "1");
    await expect
      .poll(() => topFade.evaluate((el) => el.clientHeight))
      .toBeGreaterThan(0);
    await expect(menu).toHaveCount(1);
    expect(await menu.boundingBox()).toEqual(bounds);
    await thumb.hover();
    await expect(handle).toHaveCSS("opacity", "1");
    const grab = (await thumb.boundingBox())!;
    const track = (await rail.boundingBox())!;
    await page.mouse.move(grab.x + grab.width / 2, grab.y + grab.height / 2);
    await page.mouse.down();
    await page.mouse.move(grab.x + grab.width / 2, track.y + track.height);
    await page.mouse.up();
    await expect
      .poll(() =>
        viewport.evaluate(
          (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
        ),
      )
      .toBeLessThan(1);
    await expect(thumb).toBeFocused();
    await thumb.press("Home");
    await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBe(0);
    await expect(topFade).toHaveCSS("height", "0px");
    await expect(thumb).toBeFocused();
    await thumb.press("End");
    await expect
      .poll(() =>
        viewport.evaluate(
          (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
        ),
      )
      .toBeLessThan(1);
    await expect(thumb).toBeFocused();
    await thumb.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.keyboard.press("End");
    const last = menu.getByRole("menuitemcheckbox", {
      name: "Experimental 10",
      exact: true,
    });
    await expect(last).toBeFocused();
    await expect(last).toBeInViewport();
    await page.keyboard.press("Home");
    const first = menu.getByRole("menuitemcheckbox", {
      name: "Quick 01",
      exact: true,
    });
    await expect(first).toBeFocused();
    await expect(first).toBeInViewport();
  });
}
