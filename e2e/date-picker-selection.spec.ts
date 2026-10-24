import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, story: string) {
  await page.clock.setFixedTime(new Date("2026-10-24T12:00:00Z"));
  await page.goto(
    `/iframe.html?id=components-datepicker--${story}&viewMode=story`,
  );
  await page.getByRole("button", { expanded: false }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
const popup = (page: Page) => page.getByRole("dialog");
const day = (page: Page, date: string) =>
  popup(page).locator(`[data-date="${date}"]`);
const values = (page: Page, name = "dates") =>
  page
    .locator(`input[name="${name}"]`)
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLInputElement).value),
    );

test("date info supplies holiday availability, decorative markers and accessible details without resizing", async ({
  page,
}) => {
  await open(page, "date-information");
  const height = await popup(page).evaluate((node) => node.clientHeight);
  await day(page, "2026-10-26").hover();
  await expect(day(page, "2026-10-26")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(day(page, "2026-10-26")).toHaveAccessibleName(
    /Company holiday.*office is closed/,
  );
  await expect(
    popup(page).getByText("Company holiday", { exact: true }),
  ).toBeVisible();
  await day(page, "2026-10-26").click({ force: true });
  expect(await values(page, "date")).toEqual(["2026-10-24"]);
  await day(page, "2026-10-30").focus();
  await expect(day(page, "2026-10-30")).toContainText("◆");
  await expect(
    popup(page).getByText("Release day", { exact: true }),
  ).toBeVisible();
  expect(await popup(page).evaluate((node) => node.clientHeight)).toBe(height);
  await day(page, "2026-10-30").press("Enter");
  expect(await values(page, "date")).toEqual(["2026-10-30"]);
  await expect(popup(page)).toHaveCount(0);
});

test("multiple selection toggles days, stays open, clears and returns keyboard focus before Done", async ({
  page,
}) => {
  await open(page, "multiple");
  await expect(popup(page).getByRole("grid")).toHaveAttribute(
    "aria-multiselectable",
    "true",
  );
  await day(page, "2026-10-23").click();
  expect(await values(page)).toEqual([
    "2026-10-21",
    "2026-10-23",
    "2026-10-24",
  ]);
  await expect(popup(page).getByRole("status")).toHaveText("3 selected");
  await day(page, "2026-10-21").press("Enter");
  expect(await values(page)).toEqual(["2026-10-23", "2026-10-24"]);
  await popup(page).getByRole("button", { name: "Done", exact: true }).click();
  await expect(popup(page)).toHaveCount(0);
  const trigger = page.getByRole("button", { name: /^Dates:/ });
  await expect(trigger).toBeFocused();
  await trigger.click();
  await popup(page).getByRole("button", { name: "Clear date" }).click();
  expect(await values(page)).toEqual([]);
  await expect(
    popup(page).getByRole("gridcell", { selected: true }),
  ).toHaveCount(0);
  await expect(popup(page).locator("[data-date]:focus")).toHaveCount(1);
  await popup(page).getByRole("button", { name: "Done", exact: true }).click();
  await expect(trigger).toContainText("Choose date");
});

test("range selection previews reverse and cross-month intervals, preserving a pending start across dismissal", async ({
  page,
}) => {
  await open(page, "range");
  await day(page, "2026-10-21").click();
  expect(await values(page, "period.start")).toEqual(["2026-10-21"]);
  expect(await values(page, "period.end")).toEqual([""]);
  await expect(
    popup(page).getByRole("button", { name: "Done", exact: true }),
  ).toBeDisabled();
  await expect(popup(page).getByRole("status")).toHaveText(
    "Choose an end date",
  );
  await day(page, "2026-10-24").hover();
  await expect(popup(page).locator('[data-band="preview"]')).toHaveCount(4);
  await day(page, "2026-10-19").hover();
  await expect(popup(page).locator('[data-band="preview"]')).toHaveCount(3);
  await day(page, "2026-10-19").click();
  await expect(popup(page)).toHaveCount(0);
  expect(await values(page, "period.start")).toEqual(["2026-10-19"]);
  expect(await values(page, "period.end")).toEqual(["2026-10-21"]);
  const trigger = page.getByRole("button", { name: /^Period:/ });
  await trigger.click();
  await expect(
    popup(page).getByRole("gridcell", { selected: true }),
  ).toHaveCount(3);
  await expect(popup(page).locator("[data-selected]")).toHaveCount(2);
  await day(page, "2026-10-25").click();
  await page.keyboard.press("Escape");
  await trigger.click();
  await expect(day(page, "2026-10-25")).toBeFocused();
  await popup(page).getByRole("button", { name: "Next month" }).click();
  await day(page, "2026-11-02").click();
  expect(await values(page, "period.start")).toEqual(["2026-10-25"]);
  expect(await values(page, "period.end")).toEqual(["2026-11-02"]);
});

test("an unavailable interior day rejects a range atomically and keeps the original anchor", async ({
  page,
}) => {
  await open(page, "restricted-range");
  await day(page, "2026-10-24").click();
  await day(page, "2026-10-28").click();
  await expect(popup(page).getByRole("status")).toHaveText(
    "This selection is unavailable.",
  );
  expect(await values(page, "period.start")).toEqual(["2026-10-24"]);
  expect(await values(page, "period.end")).toEqual([""]);
  await day(page, "2026-10-23").click();
  expect(await values(page, "period.start")).toEqual(["2026-10-23"]);
  expect(await values(page, "period.end")).toEqual(["2026-10-24"]);
});

test("custom date windows preview and toggle whole groups while rejecting holidays and bounds", async ({
  page,
}) => {
  await open(page, "three-day-selection");
  await day(page, "2026-10-23").hover();
  await expect(popup(page).locator("[data-preview]")).toHaveCount(3);
  expect(await values(page)).toEqual([]);
  await day(page, "2026-10-23").click();
  expect(await values(page)).toEqual([
    "2026-10-22",
    "2026-10-23",
    "2026-10-24",
  ]);
  await day(page, "2026-10-22").click();
  expect(await values(page)).toEqual([
    "2026-10-21",
    "2026-10-22",
    "2026-10-23",
    "2026-10-24",
  ]);
  await day(page, "2026-10-23").click();
  expect(await values(page)).toEqual(["2026-10-21"]);
  await expect(day(page, "2026-10-25")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await day(page, "2026-10-25").click({ force: true });
  expect(await values(page)).toEqual(["2026-10-21"]);
  await expect(day(page, "2026-10-01")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

test("one week resolver produces either a complete range or independently toggled week sets", async ({
  page,
}) => {
  await open(page, "week-selection");
  await day(page, "2026-10-24").hover();
  await expect(popup(page).locator('[data-band="preview"]')).toHaveCount(7);
  await day(page, "2026-10-24").click();
  await expect(popup(page)).toHaveCount(0);
  expect(await values(page, "week.start")).toEqual(["2026-10-19"]);
  expect(await values(page, "week.end")).toEqual(["2026-10-25"]);
  await open(page, "toggle-weeks");
  await day(page, "2026-10-24").click();
  expect(await values(page)).toHaveLength(7);
  await popup(page).getByRole("button", { name: "Next month" }).click();
  await day(page, "2026-11-04").click();
  expect(await values(page)).toHaveLength(14);
  await day(page, "2026-11-04").click();
  expect(await values(page)).toEqual([
    "2026-10-19",
    "2026-10-20",
    "2026-10-21",
    "2026-10-22",
    "2026-10-23",
    "2026-10-24",
    "2026-10-25",
  ]);
});

test("a custom resolver can replace the clicked weekend with the week's workdays", async ({
  page,
}) => {
  await open(page, "custom-selection");
  await day(page, "2026-10-24").hover();
  await expect(popup(page).locator("[data-preview]")).toHaveCount(5);
  await day(page, "2026-10-24").click();
  expect(await values(page)).toEqual([
    "2026-10-19",
    "2026-10-20",
    "2026-10-21",
    "2026-10-22",
    "2026-10-23",
  ]);
  await expect(day(page, "2026-10-24").locator("..")).toHaveAttribute(
    "aria-selected",
    "false",
  );
  await day(page, "2026-10-25").click();
  expect(await values(page)).toEqual([]);
});

test("multiple form values use repeated names, native reset and omit empty sets", async ({
  page,
}) => {
  await open(page, "multiple-form");
  await day(page, "2026-10-24").click();
  await popup(page).getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByLabel("Submitted dates")).toHaveText(
    '["2026-10-21","2026-10-24"]',
  );
  await page.getByRole("button", { name: "Reset form", exact: true }).click();
  expect(await values(page)).toEqual(["2026-10-21"]);
  await page.getByRole("button", { name: /^Dates:/ }).click();
  await popup(page).getByRole("button", { name: "Clear date" }).click();
  await popup(page).getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByLabel("Submitted dates")).toHaveText("[]");
});

test("controlled ranges submit separate endpoints and respect closeOnSelect=false", async ({
  page,
}) => {
  await open(page, "controlled-range");
  await day(page, "2026-10-21").click();
  await expect(page.getByLabel("Selected range")).toHaveText(
    '{"start":"2026-10-21","end":null}',
  );
  await day(page, "2026-10-24").click();
  await expect(popup(page)).toBeVisible();
  await expect(page.getByLabel("Selected range")).toHaveText(
    '{"start":"2026-10-21","end":"2026-10-24"}',
  );
  await popup(page).getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByLabel("Submitted range")).toHaveText(
    '{"period.start":"2026-10-21","period.end":"2026-10-24"}',
  );
  await page.getByRole("button", { name: "Set range", exact: true }).click();
  expect(await values(page, "period.start")).toEqual(["2026-11-02"]);
  await page.getByRole("button", { name: /^Period:/ }).click();
  await expect(day(page, "2026-11-02")).toBeFocused();
  await page.screenshot({ path: "/tmp/nox-datepicker-range.png" });
  await popup(page).getByRole("button", { name: "Clear date" }).click();
  await expect(page.getByLabel("Selected range")).toHaveText("null");
  expect(await values(page, "period.start")).toEqual([""]);
  expect(await values(page, "period.end")).toEqual([""]);
});
