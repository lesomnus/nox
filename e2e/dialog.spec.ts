import { expect, test } from "@playwright/test";

const story = (name: string) =>
  `/iframe.html?id=components-dialog--${name}&viewMode=story`;

test("composed labels, modal focus and opener restoration work through reopen and native close", async ({
  page,
}) => {
  await page.goto(story("default"));
  const launch = page.getByRole("button", { name: "Open dialog", exact: true });
  await expect(page.locator("dialog")).toHaveCount(0);
  for (let index = 0; index < 2; index++) {
    await launch.click();
    const dialog = page.getByRole("dialog", { name: "Workspace information" });
    await expect(dialog).toBeVisible();
    const title = dialog.getByRole("heading", {
      name: "Workspace information",
    });
    expect(await dialog.getAttribute("aria-labelledby")).toBe(
      await title.getAttribute("id"),
    );
    await expect(dialog).toHaveAccessibleDescription(
      "Reusable content with caller-owned actions.",
    );
    const close = dialog.getByRole("button", { name: "Close", exact: true });
    await expect(close).toBeFocused();
    await close.press("Tab");
    await expect(close).toBeFocused();
    await close.press("Shift+Tab");
    await expect(close).toBeFocused();
    if (index === 0) await close.press("Escape");
    else await dialog.evaluate((node: HTMLDialogElement) => node.close());
    await expect(dialog).toHaveCount(0);
    await expect(launch).toBeFocused();
  }
});

test("footer content and button variants are caller-defined and content clicks do not dismiss", async ({
  page,
}) => {
  await page.goto(story("custom-footer"));
  await page.getByRole("button", { name: "Open dialog", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Export data" });
  await expect(dialog.locator(".dialog-footer").getByRole("button")).toHaveText(
    ["JSON", "CSV", "Close"],
  );
  const solid = dialog.getByRole("button", { name: "CSV", exact: true });
  await expect(solid).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await solid.click();
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("status", { includeHidden: true })).toHaveText(
    "CSV exported",
  );
  await dialog.locator(".dialog-body").click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(1, 1);
  await expect(dialog).toHaveCount(0);
});

test("forms choose initial focus, wrap keyboard navigation and submit without built-in action policy", async ({
  page,
}) => {
  await page.goto(story("form"));
  const launch = page.getByRole("button", { name: "Open dialog", exact: true });
  await launch.click();
  const dialog = page.getByRole("dialog", { name: "Edit workspace" });
  const input = dialog.getByRole("textbox", { name: "Workspace name" });
  await expect(input).toBeFocused();
  await input.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await input.fill("New workspace");
  await input.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Saved: New workspace");
  await expect(launch).toBeFocused();
});

test("caller-owned pending policy blocks dismissal and failure can retry", async ({
  page,
}) => {
  await page.goto(story("failure-and-retry"));
  await page.getByRole("button", { name: "Open operation" }).click();
  const dialog = page.getByRole("dialog", { name: "Save workspace" });
  await expect(
    dialog.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeFocused();
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toHaveAttribute("aria-busy", "true");
  await page.keyboard.press("Escape");
  await page.mouse.click(1, 1);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("alert")).toHaveText("Save failed. Try again.");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Action completed");
});

test("a footer is optional and a dialog with no controls retains keyboard focus", async ({
  page,
}) => {
  await page.goto(story("without-footer"));
  await page.getByRole("button", { name: "Open dialog", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Read-only information" });
  await expect(dialog.locator(".dialog-footer")).toHaveCount(0);
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("long bodies keep the header and footer in the mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 480 });
  await page.goto(story("long-content"));
  await page.getByRole("button", { name: "Open dialog", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Resources" });
  await dialog.evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .map((a) => a.finished.catch(() => {})),
    );
  });
  const header = dialog.locator(".dialog-header"),
    footer = dialog.locator(".dialog-footer");
  const before = {
    header: await header.boundingBox(),
    footer: await footer.boundingBox(),
  };
  const viewport = dialog.locator('.dialog-body [data-scroll-area="viewport"]');
  expect(
    await viewport.evaluate((el) => el.scrollHeight > el.clientHeight),
  ).toBe(true);
  await viewport.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  expect(await header.boundingBox()).toEqual(before.header);
  expect(await footer.boundingBox()).toEqual(before.footer);
  const bounds = (await dialog.boundingBox())!;
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(480);
  await expect(
    dialog.getByRole("button", { name: "Close", exact: true }),
  ).toBeVisible();
});

test("nested dialogs restore focus to the correct layer", async ({ page }) => {
  await page.goto(story("nested"));
  const launch = page.getByRole("button", { name: "Open dialog", exact: true });
  await launch.click();
  const innerLaunch = page.getByRole("button", { name: "Open nested dialog" });
  await innerLaunch.click();
  await expect(page.locator("dialog")).toHaveCount(2);
  await page.getByRole("button", { name: "Close inner" }).click();
  await expect(page.locator("dialog")).toHaveCount(1);
  await expect(innerLaunch).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).toHaveCount(0);
  await expect(launch).toBeFocused();
});
