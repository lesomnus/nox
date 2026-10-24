import { expect, test, type Page } from "@playwright/test";
const story = async (page: Page, id: string) => {
  await page.clock.setFixedTime(new Date("2026-10-24T12:00:00Z"));
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
};
test("generic slider shares value/ticks, supports decimal form values/reset and native vertical keys", async ({
  page,
}) => {
  await story(page, "components-slider--composed");
  const range = page.getByRole("slider", { name: "Volume" });
  await range.press("Home");
  await range.press("ArrowRight");
  await expect(page.getByLabel("Volume value")).toHaveText("1");
  await range.press("End");
  await expect(page.getByLabel("Volume value")).toHaveText("100");
  await expect(
    page.getByRole("group", { name: "Volume" }).locator('[aria-hidden="true"]'),
  ).toContainText("0255075100");
  await story(page, "components-slider--form");
  const gain = page.getByRole("slider", { name: "Gain" });
  await gain.press("ArrowRight");
  await expect(page.getByLabel("Gain value")).toHaveText("3");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByLabel("Submitted gain")).toHaveText("3");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(gain).toHaveValue("2.5");
  await expect(page.getByLabel("Gain value")).toHaveText("2.5");
  await story(page, "components-slider--vertical");
  const vertical = page.getByRole("slider", { name: "Volume" });
  await expect(vertical).toHaveAttribute("aria-orientation", "vertical");
  const box = (await vertical.boundingBox())!;
  expect(box.height).toBeGreaterThan(box.width);
  await vertical.press("Home");
  await expect(vertical).toHaveValue("0");
  await vertical.press("ArrowUp");
  await expect(vertical).toHaveValue("1");
  await story(page, "components-slider--read-only");
  const locked = page.getByRole("slider", { name: "Volume" });
  await locked.press("End");
  await expect(locked).toHaveValue("40");
  await story(page, "components-settingslider--inherited");
  const setting = page.getByRole("slider");
  await expect(setting).toHaveAccessibleName("Indentation size");
  await expect(setting).toHaveAttribute("aria-valuetext", "Inherited: 3");
  await setting.press("ArrowRight");
  await expect(setting).toHaveAttribute("aria-valuetext", "1");
  await setting.press("Home");
  await expect(setting).toHaveAttribute("aria-valuetext", "Inherited: 3");
});

test("description list parts retain native semantics and EditableValue labeling with multiple values", async ({
  page,
}) => {
  await story(page, "components-descriptionlist--composed");
  await expect(page.locator("dl")).toHaveAccessibleName("Workspace details");
  const row = page
    .getByRole("term")
    .filter({ hasText: "Maintainers" })
    .locator("..");
  await expect(row.locator("dd")).toHaveCount(2);
  await expect(row.locator("dd").first()).toHaveText("Alice");
  await page.getByRole("button", { name: "Edit Name" }).click();
  const input = page.getByRole("textbox", { name: "Name", exact: true });
  await expect(input).toBeFocused();
  await input.fill("Renamed workspace");
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit Name" })).toHaveText(
    "Renamed workspace",
  );
});

test("navigation panel parts preserve names, pin a footer and permit plain bodies", async ({
  page,
}) => {
  await story(page, "layout-navigationpanel--composed");
  const panel = page.getByRole("complementary", { name: "Documents" });
  await expect(panel).toBeVisible();
  const footer = panel.locator("footer");
  const before = (await footer.boundingBox())!;
  await panel.locator('[data-scroll-area="viewport"]').evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await expect(
    panel.getByRole("button", { name: "Document 30", exact: true }),
  ).toBeVisible();
  expect((await footer.boundingBox())!.y).toBeCloseTo(before.y, 0);
  await page.getByRole("textbox", { name: "Filter documents" }).fill("30");
  await expect(panel.getByRole("button", { name: /^Document / })).toHaveCount(
    1,
  );
  await panel.getByRole("button", { name: "Toggle title" }).click();
  await expect(panel).toHaveAccessibleName("Documents");
  await panel.getByRole("button", { name: "Toggle title" }).click();
  await expect(panel).toHaveAccessibleName("Documents");
  await story(page, "layout-navigationpanel--without-scroll");
  await expect(
    page.getByRole("complementary", { name: "Shortcuts" }),
  ).toBeVisible();
  await expect(page.locator('[data-scroll-area="viewport"]')).toHaveCount(0);
  await expect(page.locator("footer")).toHaveText("Version 1.0");
});

test("standalone Calendar selects and navigates inline without a dialog or focus stealing", async ({
  page,
}) => {
  await story(page, "components-calendar--default");
  const root = page.getByRole("group", { name: "Schedule", exact: true });
  await expect(root).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await root.evaluate((node) => node.contains(document.activeElement)),
  ).toBe(false);
  await root
    .locator('[data-sliding-page][data-active] [data-date="2026-10-28"]')
    .click();
  await expect(page.locator('input[name="date"]')).toHaveValue("2026-10-28");
  await expect(root).toBeVisible();
  await page.keyboard.press("PageDown");
  await expect(
    root.locator('[data-sliding-page][data-active] [data-date="2026-11-28"]'),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator('input[name="date"]')).toHaveValue("2026-11-28");
  await root.getByRole("button", { name: "Clear date" }).click();
  await expect(page.locator('input[name="date"]')).toHaveValue("");
  await story(page, "components-calendar--controlled");
  await page.getByRole("button", { name: "Set date" }).click();
  await expect(page.getByRole("grid")).toHaveAccessibleName("January 2027");
  await expect(page.getByRole("button", { name: "Set date" })).toBeFocused();
  await expect(
    page.locator('[data-sliding-page][data-active] [data-date="2027-01-15"]'),
  ).toHaveAttribute("data-selected");
});

test("composed Calendar uses custom navigation/footer, metadata, atomic ranges and grid-only labels", async ({
  page,
}) => {
  await story(page, "components-calendar--composed");
  const root = page.getByRole("group", {
    name: "Custom schedule",
    exact: true,
  });
  await root
    .locator('[data-sliding-page][data-active] [data-date="2026-10-26"]')
    .hover();
  await expect(root.getByText("Office closed", { exact: true })).toBeVisible();
  await root
    .locator('[data-sliding-page][data-active] [data-date="2026-10-28"]')
    .click();
  await expect(root.getByRole("status")).toHaveText(
    "This selection is unavailable.",
  );
  await root
    .locator('[data-sliding-page][data-active] [data-date="2026-10-24"]')
    .click();
  await expect(page.getByLabel("Selected range")).toHaveText(
    '{"start":"2026-10-21","end":"2026-10-24"}',
  );
  const footerButtons = root.locator("footer button");
  await expect(footerButtons.first()).toHaveText("Clear date");
  await root.getByRole("button", { name: "Next month" }).click();
  await expect(root.getByRole("grid")).toHaveAccessibleName("November 2026");
  await story(page, "components-calendar--grid-only");
  await expect(page.getByRole("grid")).toHaveAccessibleName("October 2026");
  await expect(page.getByRole("button", { name: "Next month" })).toHaveCount(0);
  await page
    .locator('[data-sliding-page][data-active] [data-date="2026-10-24"]')
    .press("PageDown");
  await expect(page.getByRole("grid")).toHaveAccessibleName("November 2026");
});

test("inline Calendar form reset and disabled/read-only states preserve their owners", async ({
  page,
}) => {
  await story(page, "components-calendar--form");
  await page
    .locator('[data-sliding-page][data-active] [data-date="2026-10-28"]')
    .click();
  await page
    .locator('[data-sliding-page][data-active] [data-date="2026-10-30"]')
    .click();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByLabel("Submitted period")).toHaveText(
    '{"period.start":"2026-10-28","period.end":"2026-10-30"}',
  );
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator('input[name="period.start"]')).toHaveValue(
    "2026-10-21",
  );
  await expect(page.locator('input[name="period.end"]')).toHaveValue(
    "2026-10-24",
  );
  await story(page, "components-calendar--disabled");
  await expect(
    page.locator('[data-sliding-page][data-active] [data-date="2026-10-24"]'),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Clear date" })).toBeDisabled();
  await story(page, "components-calendar--read-only");
  await page
    .locator('[data-sliding-page][data-active] [data-date="2026-10-28"]')
    .click({ force: true });
  await expect(page.locator('input[name="date"]')).toHaveValue("2026-10-24");
  await expect(page.getByRole("button", { name: "Clear date" })).toBeDisabled();
});

test("inline Calendar clamps its initial month to bounds and refocuses a reselected Today", async ({
  page,
}) => {
  await story(page, "components-calendar--default");
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(
    page.locator('[data-sliding-page][data-active] [data-date="2026-10-24"]'),
  ).toBeFocused();
  await story(page, "components-calendar--bounded");
  await expect(page.getByRole("grid")).toHaveAccessibleName("December 2026");
  await expect(page.getByRole("button", { name: "Next month" })).toBeDisabled();
  await expect(
    page.locator('[data-sliding-page][data-active] [data-date="2026-12-31"]'),
  ).toHaveAttribute("tabindex", "0");
});
