import { expect, test } from "@playwright/test";

test("an outward action-menu handle escapes the reveal mask and stays usable at the viewport edge", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 440 });
  await page.goto(
    "/iframe.html?id=components-actionmenu--outside-scrollbar&viewMode=story",
  );
  const trigger = page.getByRole("button", {
    name: "Scrollable actions",
    exact: true,
  });
  await trigger.click();
  const popup = page.locator(".action-menu-popup");
  const area = popup.locator('[data-scroll-area="root"]');
  const viewport = area.locator('[data-scroll-area="viewport"]');
  const thumb = area.getByRole("scrollbar");
  const handle = area.locator('[data-scroll-area="handle"]');
  await expect(popup.locator("[data-menu-frame]")).toHaveCSS(
    "mask-image",
    "none",
  );
  await expect(popup.locator("[data-menu-frame]")).toHaveCSS("filter", "none");
  await area.hover();
  await page.evaluate(() => {
    document.body.style.background =
      "repeating-linear-gradient(0deg, #222 0 2px, #ddd 2px 4px)";
  });
  const railElement = area.locator('[data-scroll-area="rail"]');
  await expect
    .poll(() =>
      railElement.evaluate(
        (node) => getComputedStyle(node, "::before").opacity,
      ),
    )
    .toBe("1");
  const background = (await railElement.boundingBox())!;
  const clip = {
    x: Math.round(background.x + background.width / 2 - 2),
    y: Math.round(background.y + background.height - 30),
    width: 4,
    height: 20,
  };
  const blurred = await page.screenshot({ clip });
  const override = await page.addStyleTag({
    content:
      '[data-scroll-area="rail"]::before { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }',
  });
  expect((await page.screenshot({ clip })).equals(blurred)).toBe(false);
  await override.evaluate((node) => node.remove());
  const bounds = (await popup.boundingBox())!;
  const drawn = (await handle.boundingBox())!;
  expect(drawn.x).toBeGreaterThan(bounds.x + bounds.width);
  expect(drawn.x + drawn.width).toBeLessThan(360);
  const footer = popup.locator('[data-menu-fixed="footer"]');
  const fixed = await footer.boundingBox();
  await page.mouse.move(drawn.x + drawn.width / 2, drawn.y + drawn.height / 2);
  await expect(handle).toHaveCSS("opacity", "1");
  expect(
    await handle.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return node.parentElement!.contains(
        document.elementFromPoint(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
        ),
      );
    }),
  ).toBe(true);
  const rail = (await area.locator('[data-scroll-area="rail"]').boundingBox())!;
  await page.mouse.down();
  await page.mouse.move(drawn.x + drawn.width / 2, rail.y + rail.height);
  await page.mouse.up();
  await expect(popup).toBeVisible();
  await expect
    .poll(() =>
      viewport.evaluate(
        (node) => node.scrollHeight - node.clientHeight - node.scrollTop,
      ),
    )
    .toBeLessThan(1);
  expect(await footer.boundingBox()).toEqual(fixed);
  await thumb.press("Home");
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBe(0);
  await popup.getByRole("button", { name: "Keep menu open" }).click();
  await expect(popup).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

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
