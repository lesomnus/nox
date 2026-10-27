import { expect, test } from "@playwright/test";

test("ValueMenu uses ScrollArea for wheel, drag and independent scrollbar keyboard navigation", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=menus-features--scrolling&viewMode=story");
  const trigger = page.getByRole("combobox", { name: "Preset", exact: true });
  await trigger.click();
  const menu = page.getByRole("listbox", { name: "Preset choices" });
  const area = page.locator('.setting-menu [data-scroll-area="root"]');
  const viewport = area.locator('[data-scroll-area="viewport"]');
  const rail = area.locator('[data-scroll-area="rail"]');
  const thumb = area.getByRole("scrollbar", { name: "Scroll Preset choices" });
  const handle = area.locator('[data-scroll-area="handle"]');
  await expect(thumb).toBeVisible();
  await expect(viewport).toHaveCSS("scrollbar-width", "none");
  await expect(viewport).toHaveCSS("height", "240px");
  await viewport.hover();
  await page.mouse.wheel(0, 400);
  await expect
    .poll(() => viewport.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  await thumb.hover();
  await expect(handle).toHaveCSS("opacity", "1");
  const thumbBox = (await thumb.boundingBox())!;
  const railBox = (await rail.boundingBox())!;
  await page.mouse.move(
    thumbBox.x + thumbBox.width / 2,
    thumbBox.y + thumbBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    thumbBox.x + thumbBox.width / 2,
    railBox.y + railBox.height,
  );
  await page.mouse.up();
  await expect
    .poll(() =>
      viewport.evaluate(
        (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
      ),
    )
    .toBeLessThan(1);
  await expect(thumb).toBeFocused();

  // The menu must not reinterpret the thumb's Home/End as option navigation.
  await thumb.press("Home");
  await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBe(0);
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
  await expect(trigger).toHaveText("Quick 01");
  await thumb.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.keyboard.press("End");
  const last = menu.getByRole("option", {
    name: "Experimental 10",
    exact: true,
  });
  await expect(last).toBeFocused();
  await expect(last).toBeInViewport();
  await expect
    .poll(() => viewport.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
});

test("filtering shrinks ScrollArea and removes its thumb when choices fit", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=menus-features--searchable-scrolling&viewMode=story",
  );
  await page.getByRole("combobox", { name: "Preset", exact: true }).click();
  const search = page.getByRole("combobox", { name: "Search Preset" });
  const list = page.getByRole("listbox", { name: "Preset choices" });
  const viewport = list.locator('[data-scroll-area="viewport"]');
  const thumb = list.getByRole("scrollbar", { name: "Scroll Preset choices" });
  await expect(thumb).toBeVisible();
  await search.fill("Deep 10");
  await expect(list.getByRole("option")).toHaveCount(1);
  await expect(thumb).toHaveCount(0);
  await expect
    .poll(() => viewport.evaluate((el) => el.clientHeight))
    .toBeLessThan(100);
  await expect(search).toBeFocused();
  await search.fill("");
  await expect(list.getByRole("option")).toHaveCount(40);
  await expect(thumb).toBeVisible();
  await expect(viewport).toHaveCSS("height", "240px");
  await search.fill("missing");
  await expect(list.getByRole("status")).toHaveText("No matches");
  await expect(thumb).toHaveCount(0);
});
