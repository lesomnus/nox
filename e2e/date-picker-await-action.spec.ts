import { expect, test, type Page } from "@playwright/test";

const recipe =
  "/iframe.html?id=patterns-handlerfailures--date-change&viewMode=story";
const pendingStory =
  "/iframe.html?id=components-datepicker--await-selection&viewMode=story";
const day = (page: Page, date: string) =>
  page.locator(`[data-sliding-page][data-active] [data-date="${date}"]`);

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-24T12:00:00Z"));
});

test("a failed date stays open with error feedback on that day, and retry closes on success", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(recipe);
  const trigger = page.getByRole("button", { name: /^Schedule:/ });
  await trigger.click();
  const popup = page.getByRole("dialog", { name: "Calendar for Schedule" });
  const choice = day(page, "2026-10-24");
  await choice.evaluate(async (node) => {
    await Promise.all(
      node
        .closest('[role="dialog"]')!
        .getAnimations()
        .map((a) => a.finished),
    );
  });
  const bounds = await choice.boundingBox();
  await choice.evaluate((node) => {
    (node as HTMLButtonElement).click();
    (node as HTMLButtonElement).click();
  });
  await expect(trigger).toHaveAttribute("aria-busy", "true");
  await choice.blur();
  await expect(popup).toBeVisible();
  await expect(page.getByLabel("Saved value")).toHaveText("2026-10-21");
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Connection lost");
  await expect(choice).toHaveAttribute("data-action-error-open", "true");
  await expect(trigger).not.toHaveAttribute("data-action-error-open");
  expect(await choice.boundingBox()).toEqual(bounds);
  expect((await choice.getAttribute("aria-describedby"))?.split(" ")).toContain(
    await alert.getAttribute("id"),
  );
  await alert.getByRole("button", { name: "Dismiss error" }).click();
  await expect(choice).toBeFocused();
  await expect(popup).toBeVisible();
  await choice.press("Enter");
  await expect(trigger).toHaveAttribute("aria-busy", "true");
  await expect(popup).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByLabel("Saved value")).toHaveText("2026-10-24");
  expect(errors).toEqual([]);
});

test("late failure and success cannot affect a manually reopened calendar", async ({
  page,
}) => {
  await page.goto(recipe);
  const trigger = page.getByRole("button", { name: /^Schedule:/ });
  const popup = page.getByRole("dialog", { name: "Calendar for Schedule" });
  for (const result of ["failure", "success"]) {
    await trigger.click();
    await day(page, "2026-10-24").click();
    await expect(trigger).toHaveAttribute("aria-busy", "true");
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
    await trigger.click();
    await expect(popup).toBeVisible();
    await expect(trigger).not.toHaveAttribute("aria-busy", "true");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(popup).toBeVisible();
    await expect(page.getByLabel("Saved value")).toHaveText(
      result === "success" ? "2026-10-24" : "2026-10-21",
    );
    await page.keyboard.press("Escape");
  }
});

for (const mode of ["single", "multiple", "range"] as const) {
  test(`uncontrolled ${mode} commits after success and preserves its closing policy`, async ({
    page,
  }) => {
    await page.goto(`${pendingStory}&args=mode:${mode}`);
    const trigger = page.getByRole("button", { name: /^Date:/ });
    const popup = page.getByRole("dialog", { name: "Calendar for Date" });
    const field = page.locator('input[name="date"]');
    await expect(trigger).toHaveAttribute("data-mode", mode);
    await trigger.click();
    await day(page, "2026-10-28").click();
    await expect(trigger).toHaveAttribute("aria-busy", "true");
    await expect(popup).toBeVisible();
    if (mode === "single") await expect(field).toHaveValue("2026-10-24");
    else await expect(field).toHaveCount(0);
    await expect(trigger).not.toHaveAttribute("aria-busy", "true");
    if (mode === "single") {
      await expect(field).toHaveValue("2026-10-28");
      await expect(popup).toHaveCount(0);
      await expect(trigger).toBeFocused();
    } else if (mode === "multiple") {
      await expect(field).toHaveValue("2026-10-28");
      await expect(popup).toBeVisible();
      await popup.getByRole("button", { name: "Done", exact: true }).click();
      await expect(popup).toHaveCount(0);
    } else {
      await expect(page.locator('input[name="date.start"]')).toHaveValue(
        "2026-10-28",
      );
      await expect(popup).toBeVisible();
      await day(page, "2026-10-30").click();
      await expect(trigger).toHaveAttribute("aria-busy", "true");
      await expect(popup).toHaveCount(0);
      await expect(page.locator('input[name="date.end"]')).toHaveValue(
        "2026-10-30",
      );
    }
  });
}

test("closeOnSelect false keeps an async single-date picker open after success", async ({
  page,
}) => {
  await page.goto(`${pendingStory}&args=closeOnSelect:false`);
  const trigger = page.getByRole("button", { name: /^Date:/ });
  const popup = page.getByRole("dialog", { name: "Calendar for Date" });
  await trigger.click();
  await day(page, "2026-10-28").click();
  await expect(trigger).toHaveAttribute("aria-busy", "true");
  await expect(page.locator('input[name="date"]')).toHaveValue("2026-10-28");
  await expect(popup).toBeVisible();
  await popup.getByRole("button", { name: "Done", exact: true }).click();
  await expect(popup).toHaveCount(0);
});
