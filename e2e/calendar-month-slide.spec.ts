import { expect, test, type Locator, type Page } from "@playwright/test";

const pages = (page: Page) =>
  page.locator('[role="grid"] [data-sliding-pages]');
const active = (page: Page) =>
  pages(page).locator("[data-sliding-page][data-active]");
const day = (page: Page, date: string) =>
  active(page).locator(`[data-date="${date}"]`);
async function open(page: Page, story = "components-calendar--default") {
  await page.clock.setFixedTime(new Date("2026-10-24T12:00:00Z"));
  await page.goto(`/iframe.html?id=${story}&viewMode=story`);
  if (story.startsWith("components-datepicker")) {
    await page.getByRole("button", { expanded: false }).click();
    await page.getByRole("dialog").evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations()
          .map((animation) => animation.finished.catch(() => {})),
      );
    });
  }
  await expect(pages(page)).toBeVisible();
  await pages(page).evaluate((element) =>
    (element as HTMLElement).style.setProperty(
      "--ui-sliding-pages-duration",
      "1000ms",
    ),
  );
}
const x = (node: Locator) =>
  node.evaluate(
    (element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41,
  );

test("month navigation slides a newly mounted grid while weekday/header/footer geometry stays fixed", async ({
  page,
}) => {
  await open(page);
  const header = page.getByRole("button", { name: "Next month" });
  const weekday = page.getByRole("columnheader").first();
  const footer = page.getByRole("button", { name: "Today", exact: true });
  const before = await Promise.all(
    [pages(page), header, weekday, footer].map((node) => node.boundingBox()),
  );
  await header.click();
  await expect(active(page)).toHaveAttribute("data-sliding-page", "2026-11-01");
  await expect.poll(() => x(active(page))).toBeGreaterThan(1);
  const width = (await pages(page).boundingBox())!.width;
  expect(await x(active(page))).toBeLessThan(width);
  const old = pages(page).locator('[data-sliding-page="2026-10-01"]');
  expect(await x(old)).toBeLessThan(0);
  await expect(old).toHaveAttribute("inert", "");
  await expect(old.locator('[data-date][tabindex="0"]')).toHaveCount(0);
  await expect(day(page, "2026-11-01")).toBeFocused();
  await expect(page.getByRole("grid").getByRole("row")).toHaveCount(7);
  expect(
    await Promise.all(
      [pages(page), header, weekday, footer].map((node) => node.boundingBox()),
    ),
  ).toEqual(before);
  await page.screenshot({ path: "/tmp/nox-calendar-month-sliding.png" });
});

test("reversal retargets the existing months and repeated navigation keeps only two page grids", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page);
  await page.getByRole("button", { name: "Next month" }).click();
  await expect.poll(() => x(active(page))).toBeGreaterThan(1);
  await page
    .getByRole("button", { name: "Previous month" })
    .dispatchEvent("click");
  await expect(active(page)).toHaveAttribute("data-sliding-page", "2026-10-01");
  expect(await x(active(page))).toBeLessThan(0);
  await expect
    .poll(async () => Math.abs(await x(active(page))))
    .toBeLessThan(1);
  for (let i = 0; i < 14; i++)
    await page
      .getByRole("button", { name: "Next month" })
      .dispatchEvent("click");
  await expect(active(page)).toHaveAttribute("data-sliding-page", "2027-12-01");
  await expect(pages(page).locator("[data-sliding-page]")).toHaveCount(2);
  await expect(page.getByRole("gridcell")).toHaveCount(42);
  expect(errors).toEqual([]);
});

test("keyboard month/year jumps animate from the matching side and focus only the active day", async ({
  page,
}) => {
  await open(page);
  await day(page, "2026-10-31").focus();
  await page.keyboard.press("ArrowRight");
  await expect(day(page, "2026-11-01")).toBeFocused();
  await expect.poll(() => x(active(page))).toBeGreaterThan(1);
  await page.keyboard.press("Shift+PageDown");
  await expect(active(page)).toHaveAttribute("data-sliding-page", "2027-11-01");
  await expect(day(page, "2027-11-01")).toBeFocused();
  await expect.poll(() => x(active(page))).toBeGreaterThan(1);
  await expect
    .poll(async () => Math.abs(await x(active(page))))
    .toBeLessThan(1);
  await page.keyboard.press("Shift+PageUp");
  await expect(day(page, "2026-11-01")).toBeFocused();
  await expect.poll(() => x(active(page))).toBeLessThan(-1);
  expect(await page.evaluate(() => document.documentElement.scrollLeft)).toBe(
    0,
  );
});

test("DatePicker shares month motion without horizontal scroll and can select after navigation", async ({
  page,
}) => {
  await open(page, "components-datepicker--default");
  const popup = page.getByRole("dialog");
  const before = (await popup.boundingBox())!.height;
  await popup.getByRole("button", { name: "Next month" }).click();
  await expect(day(page, "2026-11-01")).toBeFocused();
  await expect.poll(() => x(active(page))).toBeGreaterThan(1);
  expect((await popup.boundingBox())!.height).toBe(before);
  expect(
    await popup.evaluate((element) =>
      [...element.querySelectorAll("*")].some((node) => node.scrollLeft !== 0),
    ),
  ).toBe(false);
  await day(page, "2026-11-05").click();
  await expect(page.locator('input[name="date"]')).toHaveValue("2026-11-05");
  await expect(popup).toHaveCount(0);
});

test("reduced motion changes months immediately with no slide transitions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await page.getByRole("button", { name: "Next month" }).click();
  await expect(day(page, "2026-11-01")).toBeFocused();
  expect(await x(active(page))).toBe(0);
  await expect(
    pages(page).locator('[data-sliding-page="2026-10-01"]'),
  ).toBeHidden();
  expect(
    await pages(page).evaluate(
      (element) =>
        element
          .getAnimations({ subtree: true })
          .filter((animation) => animation instanceof CSSTransition).length,
    ),
  ).toBe(0);
});
