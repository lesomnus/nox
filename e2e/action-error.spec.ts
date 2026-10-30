import { expect, test } from "@playwright/test";

const styling =
  "/iframe.html?id=components-actionerror--trigger-styling&viewMode=story";

test("error header is compact, bold and dismissible", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=components-actionerror--default&viewMode=story",
  );
  const alert = page.getByRole("alert");
  const header = alert.locator("header");
  await expect(header).toContainText("Save failed");
  const type = await header.locator("strong").evaluate((node) => {
    const title = getComputedStyle(node);
    const body = getComputedStyle(node.closest('[role="alert"]')!);
    return {
      titleSize: parseFloat(title.fontSize),
      bodySize: parseFloat(body.fontSize),
      weight: parseFloat(title.fontWeight),
    };
  });
  expect(type.titleSize).toBeLessThan(type.bodySize);
  expect(type.weight).toBeGreaterThanOrEqual(600);
  const close = header.getByRole("button", { name: "Dismiss error" });
  const title = await header.locator("strong").boundingBox();
  expect((await close.boundingBox())!.x).toBeGreaterThan(
    title!.x + title!.width,
  );
  await close.click();
  await expect(alert).toHaveCount(0);
});

test("visible feedback marks its trigger without moving it and cleans up on close", async ({
  page,
}) => {
  await page.goto(styling);
  const button = page.getByRole("button", { name: "Default border" });
  await button.evaluate((node) =>
    node.setAttribute("aria-describedby", "existing-help"),
  );
  const bounds = await button.boundingBox();
  await button.click();
  const alert = page.getByRole("alert");
  await expect(alert).toBeVisible();
  await expect(button).toHaveAttribute("data-action-error-open", "true");
  await expect(button).toHaveAttribute("data-action-error-highlight", "true");
  const stroke = await button.evaluate(
    (node) => getComputedStyle(node).boxShadow,
  );
  expect(stroke).toContain("inset");
  expect(stroke).not.toContain("rgba(0, 0, 0, 0)");
  expect(await button.boundingBox()).toEqual(bounds);
  const box = await alert.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(bounds!.y);
  await alert.getByRole("button", { name: "Dismiss error" }).click();
  await expect(alert).toHaveCount(0);
  await expect(button).not.toHaveAttribute("data-action-error-open");
  await expect(button).not.toHaveAttribute("data-action-error-highlight");
  await expect(button).toHaveAttribute("aria-describedby", "existing-help");
  await expect(button).toBeFocused();
  expect(await button.boundingBox()).toEqual(bounds);
  await button.click();
  await expect(alert).toBeVisible();
});

test("tokens and the open attribute support custom trigger appearances", async ({
  page,
}) => {
  await page.goto(styling);
  const border = page.getByRole("button", { name: "Custom border" });
  const tint = page.getByRole("button", { name: "Custom background" });
  const original = await tint.evaluate(
    (node) => getComputedStyle(node).backgroundColor,
  );
  await border.click();
  await expect(page.getByRole("alert")).toBeVisible();
  expect(
    await border.evaluate((node) => getComputedStyle(node).boxShadow),
  ).toContain("2px");
  await tint.click();
  await expect(tint).toHaveAttribute("data-action-error-open", "true");
  await expect(tint).not.toHaveAttribute("data-action-error-highlight");
  await expect(border).not.toHaveAttribute("data-action-error-open");
  expect(await tint.evaluate((node) => getComputedStyle(node).boxShadow)).toBe(
    "none",
  );
  await expect
    .poll(() => tint.evaluate((node) => getComputedStyle(node).backgroundColor))
    .not.toBe(original);
  await page.getByRole("button", { name: "Dismiss error" }).click();
  await page.mouse.move(0, 0);
  await expect
    .poll(() => tint.evaluate((node) => getComputedStyle(node).backgroundColor))
    .toBe(original);
});

test("dismissing an editor error keeps the edited draft and restores input focus", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=patterns-handlerfailures--inline-save&viewMode=story",
  );
  await page.getByRole("button", { name: "Edit Name" }).click();
  const editor = page.getByRole("dialog", { name: "Edit Name" });
  const input = editor.getByRole("textbox", { name: "Name", exact: true });
  await input.fill("Keep this draft");
  await input.press("Enter");
  const alert = editor.getByRole("alert");
  await expect(alert).toBeVisible();
  await expect(input).toHaveAttribute("data-action-error-open", "true");
  await alert.getByRole("button", { name: "Dismiss error" }).click();
  await expect(alert).toHaveCount(0);
  await expect(editor).toBeVisible();
  await expect(input).toHaveValue("Keep this draft");
  await expect(input).toBeFocused();
  await expect(input).not.toHaveAttribute("data-action-error-open");
  await editor.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByLabel("Saved value")).toHaveText("Keep this draft");
});
