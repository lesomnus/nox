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
  await expect
    .poll(() =>
      page
        .locator("tbody input:checked")
        .evaluateAll((nodes) =>
          nodes.map((node) =>
            Number(
              node.getAttribute("aria-label")!.replace("Select Item ", ""),
            ),
          ),
        ),
    )
    .toEqual(keys);
}

test("a drag with shrinking is one undo commit and restores its mixed starting values", async ({
  page,
}) => {
  await page.goto(story);
  await checkbox(page, 1).check();
  await checkbox(page, 3).check();
  await move(page, checkbox(page, 1));
  await page.mouse.down();
  await move(page, checkbox(page, 7));
  await move(page, checkbox(page, 2));
  await page.mouse.up();
  await checked(page, [3]);
  await page.keyboard.press("Control+z");
  await checked(page, [1, 3]);
  await page.keyboard.press("Control+Shift+z");
  await checked(page, [3]);
  await page.keyboard.press("Control+z");
  await page.keyboard.press("Control+z");
  await checked(page, [1]);
});

test("all endpoints during held Shift form one commit, separate from earlier clicks", async ({
  page,
}) => {
  await page.goto(story);
  await checkbox(page, 1).check();
  await page.keyboard.down("Shift");
  await checkbox(page, 7).click();
  await checkbox(page, 3).click();
  await checkbox(page, 5).click();
  await page.keyboard.up("Shift");
  await checked(page, [1, 2, 3, 5]);
  await page.keyboard.press("Control+z");
  await checked(page, [1]);
  await page.keyboard.press("Control+Shift+z");
  await checked(page, [1, 2, 3, 5]);
  await page.keyboard.press("Control+z");
  await page.keyboard.press("Control+z");
  await checked(page, []);
});

test("select-all is one commit; no-op Shift retains redo and a new edit branches history", async ({
  page,
}) => {
  await page.goto(story);
  await checkbox(page, 2).check();
  await page
    .getByRole("checkbox", { name: "Select all items", exact: true })
    .click();
  await checked(page, [1, 2, 3, 5, 6, 7, 8]);
  await page.keyboard.press("Control+z");
  await checked(page, [2]);
  await page.keyboard.press("Shift");
  await expect(
    page.getByRole("button", { name: "Redo", exact: true }),
  ).toBeEnabled();
  await page.keyboard.press("Control+Shift+z");
  await checked(page, [1, 2, 3, 5, 6, 7, 8]);
  await page.keyboard.press("Control+z");
  await checkbox(page, 8).check();
  await expect(
    page.getByRole("button", { name: "Redo", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Control+Shift+z");
  await checked(page, [2, 8]);
});

test("undo restores the anchor for the next Shift gesture and works from plain cells", async ({
  page,
}) => {
  await page.goto(story);
  await checkbox(page, 2).check();
  await checkbox(page, 7).check();
  await page.getByRole("rowheader", { name: "Item 1", exact: true }).click();
  await page.keyboard.press("Control+z");
  await checked(page, [2]);
  await checkbox(page, 5).click({ modifiers: ["Shift"] });
  await checked(page, [2, 3, 5]);
});

test("native text undo does not consume table history, including after selection redo", async ({
  page,
}) => {
  await page.goto(story);
  await checkbox(page, 2).check();
  const notes = page.getByRole("textbox", { name: "Notes" });
  await notes.focus();
  await page.keyboard.type("independent text");
  await page.keyboard.press("Control+z");
  await expect(notes).toHaveValue("");
  await checked(page, [2]);
  await page.keyboard.press("Control+Shift+z");
  await expect(notes).toHaveValue("independent text");
  await checkbox(page, 2).focus();
  await page.keyboard.press("Control+z");
  await checked(page, []);
  await expect(notes).toHaveValue("independent text");
});

test("independent lists keep separate undo scopes and buttons use the same history", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-table--independent-ranges&viewMode=story",
  );
  const first = page.getByRole("region", { name: "First list", exact: true });
  const second = page.getByRole("region", { name: "Second list", exact: true });
  const firstItem = first.getByRole("checkbox", {
    name: "Select Item 1",
    exact: true,
  });
  const secondItem = second.getByRole("checkbox", {
    name: "Select Item 2",
    exact: true,
  });
  await firstItem.check();
  await secondItem.check();
  await page.keyboard.press("Control+z");
  await expect(secondItem).not.toBeChecked();
  await page.keyboard.press("Control+z");
  await expect(firstItem).toBeChecked();
  await first.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(firstItem).not.toBeChecked();
  await second.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(secondItem).toBeChecked();
});

test("undo during pointer capture ends the gesture and release cannot toggle again", async ({
  page,
}) => {
  await page.goto(story);
  await move(page, checkbox(page, 1));
  await page.mouse.down();
  await move(page, checkbox(page, 5));
  await checked(page, [1, 2, 3, 5]);
  await page.keyboard.press("Control+z");
  await checked(page, []);
  await page.mouse.up();
  await checked(page, []);
  await page.keyboard.press("Control+Shift+z");
  await checked(page, [1, 2, 3, 5]);
});

test("unmounting the page discards selection history", async ({ page }) => {
  await page.goto(story);
  await checkbox(page, 1).check();
  await page.reload();
  await checkbox(page, 1).focus();
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Control+z");
  await checked(page, []);
});
