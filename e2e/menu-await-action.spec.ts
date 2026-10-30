import { expect, test } from "@playwright/test";

const story = "/iframe.html?id=menus-features--await-action&viewMode=story";

for (const kind of ["action", "value"] as const) {
  const opener = kind === "action" ? "Report actions" : "Quality";
  const item = kind === "action" ? "Publish report" : "High";
  const role = kind === "action" ? "menuitem" : "option";
  const menuRole = kind === "action" ? "menu" : "listbox";

  test(`${kind} awaits its handler, anchors failure to the item and closes only on success`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(story);
    const trigger = page.getByRole(kind === "action" ? "button" : "combobox", {
      name: opener,
      exact: true,
    });
    await trigger.click();
    const menu = page.getByRole(menuRole);
    const choice = page.getByRole(role, { name: item, exact: true });
    await choice.evaluate(async (node) => {
      const popup = node.closest(".action-menu-popup, .setting-menu")!;
      await Promise.all(
        popup
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished.catch(() => {})),
      );
    });
    const bounds = await choice.boundingBox();
    await choice.evaluate((node) => {
      (node as HTMLButtonElement).click();
      (node as HTMLButtonElement).click();
    });
    await expect(choice).toHaveAttribute("aria-busy", "true");
    await choice.blur();
    await expect(menu).toBeVisible();
    const alert = page.getByRole("alert");
    await expect(alert).toContainText("Connection lost");
    await expect(choice).toHaveAttribute("data-action-error-open", "true");
    await expect(trigger).not.toHaveAttribute("data-action-error-open");
    expect(await choice.boundingBox()).toEqual(bounds);
    const id = await alert.getAttribute("id");
    expect(
      (await choice.getAttribute("aria-describedby"))?.split(" "),
    ).toContain(id);
    await alert.getByRole("button", { name: "Dismiss error" }).click();
    await expect(alert).toHaveCount(0);
    await expect(menu).toBeVisible();
    await expect(choice).toBeFocused();
    await choice.click();
    await expect(choice).toHaveAttribute("aria-busy", "true");
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
    if (kind === "action")
      await expect(
        page
          .getByRole("region", { name: "ActionMenu failure example" })
          .getByRole("status"),
      ).toHaveText("Action completed");
    else await expect(page.getByLabel("Saved value")).toHaveText("high");
    expect(errors).toEqual([]);
  });

  test(`${kind} ignores late failure and success after manual dismissal and reopening`, async ({
    page,
  }) => {
    await page.goto(story);
    const trigger = page.getByRole(kind === "action" ? "button" : "combobox", {
      name: opener,
      exact: true,
    });
    for (const result of ["failure", "success"]) {
      await trigger.click();
      const choice = page.getByRole(role, { name: item, exact: true });
      await choice.click();
      await expect(choice).toHaveAttribute("aria-busy", "true");
      await choice.press("Escape");
      await expect(page.getByRole(menuRole)).toHaveCount(0);
      await trigger.click();
      await expect(page.getByRole(menuRole)).toBeVisible();
      await expect(choice).not.toHaveAttribute("aria-busy", "true");
      if (result === "success" && kind === "action")
        await expect(
          page
            .getByRole("region", { name: "ActionMenu failure example" })
            .getByRole("status"),
        ).toHaveText("Action completed");
      await page.evaluate(() => new Promise(requestAnimationFrame));
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page.getByRole(menuRole)).toBeVisible();
      await choice.press("Escape");
    }
  });
}

test("search Enter awaits the chosen option without closing on focus transfer", async ({
  page,
}) => {
  await page.goto(`${story}&args=searchable:true`);
  await page.getByRole("combobox", { name: "Quality", exact: true }).click();
  const input = page.getByRole("combobox", {
    name: "Search Quality",
    exact: true,
  });
  await input.fill("High");
  await input.press("Enter");
  const option = page.getByRole("option", { name: "High", exact: true });
  await expect(option).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(option).toHaveAttribute("data-action-error-open", "true");
  await expect(page.getByRole("listbox")).toBeVisible();
});

test("aligned ValueMenu keeps failure on its chosen row", async ({ page }) => {
  await page.goto(`${story}&args=alignItemWithTrigger:true`);
  await page.getByRole("combobox", { name: "Quality", exact: true }).click();
  await expect(
    page.locator('[data-item-aligned="true"]').first(),
  ).toBeVisible();
  const option = page.getByRole("option", { name: "High", exact: true });
  await option.click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(option).toHaveAttribute("data-action-error-open", "true");
  await page.getByRole("button", { name: "Dismiss error" }).click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(option).toBeFocused();
});
