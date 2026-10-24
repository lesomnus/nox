import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, story = "default") {
  await page.clock.setFixedTime(new Date("2026-10-24T12:00:00Z"));
  await page.goto(
    `/iframe.html?id=components-datepicker--${story}&viewMode=story`,
  );
}
const trigger = (page: Page) => page.getByRole("button", { name: /^Date:/ });
const calendar = (page: Page) =>
  page.getByRole("dialog", { name: "Calendar for Date" });

test("the four-digit year boundaries keep all week rows and do not wrap into invalid years", async ({
  page,
}) => {
  await open(page);
  await trigger(page).click();
  const popup = calendar(page);
  await popup.evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations()
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
  const height = await popup.evaluate((node) => node.clientHeight);
  await page.keyboard.press("Escape");
  for (const value of ["0001-01-01", "9999-12-31"]) {
    await page.evaluate((value) => {
      const channel = (
        window as unknown as {
          __STORYBOOK_ADDONS_CHANNEL__: {
            emit: (name: string, data: unknown) => void;
          };
        }
      ).__STORYBOOK_ADDONS_CHANNEL__;
      channel.emit("updateStoryArgs", {
        storyId: "components-datepicker--default",
        updatedArgs: { value },
      });
    }, value);
    await expect(page.locator('input[name="date"]')).toHaveValue(value);
    await trigger(page).click();
    await expect(popup.locator(`[data-date="${value}"]`)).toBeFocused();
    await expect(
      popup.getByRole("button", {
        name: value.startsWith("0001") ? "Previous month" : "Next month",
      }),
    ).toBeDisabled();
    expect(await popup.evaluate((node) => node.clientHeight)).toBe(height);
    await page.keyboard.press(
      value.startsWith("0001") ? "ArrowLeft" : "ArrowRight",
    );
    await expect(popup.locator(`[data-date="${value}"]`)).toBeFocused();
    await page.keyboard.press("Escape");
  }
});

test("date selection, clearing, Today and Escape use date-only values and restore focus", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page);
  const field = page.locator('input[name="date"]');
  await expect(field).toHaveValue("2026-10-24");
  await trigger(page).click();
  await expect(
    calendar(page).locator('[data-date="2026-10-24"]'),
  ).toBeFocused();
  await expect(
    calendar(page).getByRole("gridcell", { selected: true }),
  ).toContainText("24");
  await calendar(page).locator('[data-date="2026-10-28"]').click();
  await expect(field).toHaveValue("2026-10-28");
  await expect(calendar(page)).toHaveCount(0);
  await expect(trigger(page)).toBeFocused();
  await trigger(page).press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(field).toHaveValue("2026-10-28");
  await expect(trigger(page)).toBeFocused();
  await trigger(page).click();
  await calendar(page)
    .getByRole("button", { name: "Clear date", exact: true })
    .click();
  await expect(field).toHaveValue("");
  await expect(trigger(page)).toContainText("Choose date");
  await trigger(page).click();
  await calendar(page)
    .getByRole("button", { name: "Today", exact: true })
    .click();
  await expect(field).toHaveValue("2026-10-24");
  expect(errors).toEqual([]);
});

test("calendar keyboard navigation crosses weeks, months and years with a stable height", async ({
  page,
}) => {
  await open(page);
  await trigger(page).press("Enter");
  const popup = calendar(page),
    grid = popup.getByRole("grid");
  await popup.evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
  await popup.screenshot({ path: "/tmp/nox-datepicker-dark.png" });
  await expect(grid.getByRole("row")).toHaveCount(7);
  const height = (await popup.boundingBox())!.height;
  await page.keyboard.press("Home");
  await expect(popup.locator('[data-date="2026-10-18"]')).toBeFocused();
  await page.keyboard.press("End");
  await expect(popup.locator('[data-date="2026-10-24"]')).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(popup.locator('[data-date="2026-10-31"]')).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(popup.locator('[data-date="2026-11-01"]')).toBeFocused();
  await page.keyboard.press("PageDown");
  await expect(popup.locator('[data-date="2026-12-01"]')).toBeFocused();
  await page.keyboard.press("Shift+PageUp");
  await expect(popup.locator('[data-date="2025-12-01"]')).toBeFocused();
  expect((await popup.boundingBox())!.height).toBe(height);
  await page.evaluate(() => {
    document.documentElement.dataset.uiTheme = "light";
  });
  await popup.screenshot({ path: "/tmp/nox-datepicker-light.png" });
  await page.keyboard.press("Space");
  await expect(page.locator('input[name="date"]')).toHaveValue("2025-12-01");
});

test("bounds and unavailable dates cannot be chosen by mouse or keyboard", async ({
  page,
}) => {
  await open(page, "restricted");
  await page.getByRole("button", { name: /^Deadline:/ }).click();
  const popup = page.getByRole("dialog", { name: "Calendar for Deadline" });
  await expect(
    popup.getByRole("button", { name: "Previous month" }),
  ).toBeDisabled();
  const weekend = popup.locator('[data-date="2026-10-24"]');
  await expect(weekend).toHaveAttribute("aria-disabled", "true");
  await weekend.click({ force: true });
  await expect(popup).toBeVisible();
  await weekend.press("Enter");
  await expect(page.locator('input[name="date"]')).toHaveValue("2026-10-21");
  await popup.locator('[data-date="2026-10-11"]').click({ force: true });
  await expect(page.locator('input[name="date"]')).toHaveValue("2026-10-21");
  await popup.getByRole("button", { name: "Next month" }).click();
  await expect(popup.locator('[data-date="2026-11-01"]')).toBeFocused();
  await expect(
    popup.getByRole("button", { name: "Next month" }),
  ).toBeDisabled();
  await popup.locator('[data-date="2026-11-06"]').click();
  await expect(page.locator('input[name="date"]')).toHaveValue("2026-11-06");
});

test("native form submit/reset and controlled updates retain their separate owners", async ({
  page,
}) => {
  await open(page, "form");
  await trigger(page).click();
  await calendar(page).locator('[data-date="2026-10-29"]').click();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByLabel("Submitted date")).toHaveText("2026-10-29");
  await page.getByRole("button", { name: "Reset form", exact: true }).click();
  await expect(page.locator('input[name="date"]')).toHaveValue("2026-10-24");
  await open(page, "controlled");
  await page.getByRole("button", { name: "Set date", exact: true }).click();
  await expect(page.getByLabel("Selected date")).toHaveText("2027-01-15");
  await trigger(page).click();
  await expect(
    calendar(page).locator('[data-date="2027-01-15"]'),
  ).toBeFocused();
  await calendar(page).locator('[data-date="2027-01-18"]').click();
  await expect(page.getByLabel("Selected date")).toHaveText("2027-01-18");
  await page
    .getByRole("button", { name: "Reset selection", exact: true })
    .click();
  await expect(page.locator('input[name="date"]')).toHaveValue("");
});

test("the calendar portals inside an enclosing dialog and Escape closes only the picker", async ({
  page,
}) => {
  await open(page, "inside-dialog");
  await page.getByRole("button", { name: "Open schedule" }).click();
  await trigger(page).click();
  expect(
    await calendar(page).evaluate((node) => node.closest("dialog")?.open),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(calendar(page)).toHaveCount(0);
  await expect(
    page.getByRole("dialog", { name: "Schedule", exact: true }),
  ).toBeVisible();
  await expect(trigger(page)).toBeFocused();
  await trigger(page).click();
  await calendar(page).locator('[data-date="2026-10-25"]').click();
  await expect(
    page.getByRole("dialog", { name: "Schedule", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close schedule" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("locale/week start, read-only/disabled fields and fully unavailable calendars work", async ({
  page,
}) => {
  await open(page, "localized");
  await trigger(page).click();
  await expect(calendar(page).getByRole("columnheader").first()).toHaveText(
    "월",
  );
  await expect(calendar(page).getByRole("grid")).toHaveAccessibleName(
    "2026년 10월",
  );
  await open(page, "states");
  await expect(
    page.getByRole("button", { name: /^Disabled date:/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /^Read-only date:/ }).press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /^No clear action:/ }).click();
  await expect(page.getByRole("button", { name: "Clear date" })).toHaveCount(0);
  await open(page, "unavailable");
  await trigger(page).click();
  await expect(
    calendar(page).getByRole("button", { name: "Today", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(calendar(page)).toBeVisible();
  await expect(page.locator('input[name="date"]')).toHaveValue("");
});

test("outside click and Tab dismiss without stealing focus; a short viewport stays bounded", async ({
  page,
}) => {
  await open(page, "form");
  await trigger(page).click();
  await calendar(page).getByRole("button", { name: "Clear date" }).focus();
  await page.keyboard.press("Tab");
  await expect(calendar(page)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Submit", exact: true }),
  ).toBeFocused();
  await trigger(page).click();
  await page.mouse.click(2, 2);
  await expect(calendar(page)).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 250 });
  await open(page, "near-viewport-edge");
  await trigger(page).click();
  const popup = calendar(page);
  await expect(popup).toBeVisible();
  const bounds = (await popup.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(250);
  const viewport = popup.locator('[data-scroll-area="viewport"]');
  expect(
    await viewport.evaluate((node) => node.scrollHeight > node.clientHeight),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(trigger(page)).toBeFocused();
});
