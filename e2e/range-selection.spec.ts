import { expect, test, type Locator, type Page } from "@playwright/test";

const story =
  "/iframe.html?id=components-table--range-selection&viewMode=story";
const checkbox = (page: Page, key: number) =>
  page.getByRole("checkbox", { name: `Select Item ${key}`, exact: true });
async function move(page: Page, target: Locator) {
  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
}
async function checked(page: Page, keys: number[]) {
  for (let key = 1; key <= 8; key++) {
    if (keys.includes(key)) await expect(checkbox(page, key)).toBeChecked();
    else await expect(checkbox(page, key)).not.toBeChecked();
  }
}

test("pointer down toggles immediately and release does not toggle again, including select-all", async ({
  page,
}) => {
  await page.goto(story);
  const first = checkbox(page, 1);
  await move(page, first);
  await page.mouse.down();
  await expect(first).toBeChecked();
  await page.mouse.up();
  await expect(first).toBeChecked();
  await page.mouse.down();
  await expect(first).not.toBeChecked();
  await page.mouse.up();
  await expect(first).not.toBeChecked();
  const all = page.getByRole("checkbox", {
    name: "Select all items",
    exact: true,
  });
  await move(page, all);
  await page.mouse.down();
  await checked(page, [1, 2, 3, 5, 6, 7, 8]);
  await page.mouse.up();
  await expect(all).toBeChecked();
  await page.mouse.down();
  await checked(page, []);
  await page.mouse.up();
  await expect(all).not.toBeChecked();
});

test("drag paints a consistent value across skipped rows and reversals, and preserves disabled/outside items", async ({
  page,
}) => {
  await page.goto(story);
  await checkbox(page, 2).check();
  await move(page, checkbox(page, 1));
  await page.mouse.down();
  await move(page, checkbox(page, 6));
  await checked(page, [1, 2, 3, 5, 6]);
  await move(page, checkbox(page, 2));
  await checked(page, [1, 2, 3, 5, 6]);
  await page.mouse.up();
  await checkbox(page, 8).check();
  await move(page, checkbox(page, 6));
  await page.mouse.down();
  await move(page, checkbox(page, 1));
  await checked(page, [8]);
  await page.mouse.up();
  await checked(page, [8]);
  await expect(checkbox(page, 4)).toBeDisabled();
});

test("Shift ranges keep the original anchor, can deselect, and preserve unrelated selections", async ({
  page,
}) => {
  await page.goto(story);
  await checkbox(page, 8).check();
  await checkbox(page, 2).check();
  await checkbox(page, 6).click({ modifiers: ["Shift"] });
  await checked(page, [2, 3, 5, 6, 8]);
  await checkbox(page, 3).click({ modifiers: ["Shift"] });
  await checked(page, [5, 6, 8]);
});

test("Space, Shift-Space and programmatic activation use native checked values", async ({
  page,
}) => {
  await page.goto(story);
  await checkbox(page, 2).focus();
  await page.keyboard.press("Space");
  await checked(page, [2]);
  await checkbox(page, 6).focus();
  await page.keyboard.press("Shift+Space");
  await checked(page, [2, 3, 5, 6]);
  await checkbox(page, 8).evaluate((node) =>
    (node as HTMLInputElement).click(),
  );
  await checked(page, [2, 3, 5, 6, 8]);
});

test("anchors follow keys after sorting and an active drag stops when order changes", async ({
  page,
}) => {
  await page.goto(story);
  await checkbox(page, 2).check();
  const reverse = page.getByRole("button", { name: "Reverse order" });
  await reverse.click();
  await checkbox(page, 6).click({ modifiers: ["Shift"] });
  await checked(page, [2, 3, 5, 6]);
  await move(page, checkbox(page, 8));
  await page.mouse.down();
  await reverse.focus();
  await reverse.press("Enter");
  await move(page, checkbox(page, 7));
  await checked(page, [2, 3, 5, 6, 8]);
  await page.mouse.up();
  await checkbox(page, 7).check();
  await expect(checkbox(page, 7)).toBeChecked();
});

test("disabling selection cancels a drag and allows fresh interactions after enabling", async ({
  page,
}) => {
  await page.goto(story);
  await move(page, checkbox(page, 1));
  await page.mouse.down();
  const disable = page.getByRole("button", { name: "Disable selection" });
  await disable.focus();
  await disable.press("Enter");
  await expect(checkbox(page, 2)).toBeDisabled();
  await move(page, checkbox(page, 6));
  await page.mouse.up();
  await checked(page, [1]);
  await page.getByRole("button", { name: "Enable selection" }).click();
  await checkbox(page, 6).check();
  await checked(page, [1, 6]);
});

test("separate hooks do not paint each other even with identical item keys", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-table--independent-ranges&viewMode=story",
  );
  const first = page.getByRole("table", { name: "First list", exact: true });
  const second = page.getByRole("table", { name: "Second list", exact: true });
  await move(
    page,
    first.getByRole("checkbox", { name: "Select Item 1", exact: true }),
  );
  await page.mouse.down();
  await move(
    page,
    second.getByRole("checkbox", { name: "Select Item 6", exact: true }),
  );
  await expect(second.locator("tbody input:checked")).toHaveCount(0);
  await expect(first.locator("tbody input:checked")).toHaveCount(1);
  await page.mouse.up();
  await second
    .getByRole("checkbox", { name: "Select Item 6", exact: true })
    .check();
  await expect(second.locator("tbody input:checked")).toHaveCount(1);
});

test("blur cancels painting and consumes the interrupted release click", async ({
  page,
}) => {
  await page.goto(story);
  await move(page, checkbox(page, 1));
  await page.mouse.down();
  await expect(checkbox(page, 1)).toBeChecked();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.mouse.up();
  await expect(checkbox(page, 1)).toBeChecked();
  await move(page, checkbox(page, 2));
  await expect(checkbox(page, 2)).not.toBeChecked();
  await checkbox(page, 2).click();
  await checked(page, [1, 2]);
});

test.describe("touch", () => {
  test.use({ hasTouch: true });
  test("touch tapping keeps native checkbox activation", async ({ page }) => {
    await page.goto(story);
    await checkbox(page, 2).tap();
    await checked(page, [2]);
    await checkbox(page, 2).tap();
    await checked(page, []);
  });
});
