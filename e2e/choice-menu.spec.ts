import { expect, test } from "@playwright/test";

test("checkbox draft applies once on trigger, Escape or outside dismissal", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-checkboxmenu--default&viewMode=story",
  );
  const trigger = page.getByRole("button", { name: "Log level", exact: true });
  const chosen = page.getByLabel("Selected values");
  const applies = page.getByLabel("Apply count");
  await trigger.click();
  const all = page.getByRole("menuitemcheckbox", {
    name: "All levels",
    exact: true,
  });
  await expect(all).toBeFocused();
  await expect(all).toHaveAttribute("aria-checked", "mixed");
  await all.click();
  await page
    .getByRole("menuitemcheckbox", { name: "Information", exact: true })
    .click();
  await expect(chosen).toHaveText("info, error");
  await expect(applies).toHaveText("0");
  await trigger.click();
  await expect(chosen).toHaveText("error, warn");
  await expect(applies).toHaveText("1");
  await trigger.click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(chosen).toHaveText("error, warn, info");
  await expect(applies).toHaveText("2");
  await trigger.click();
  await all.click();
  await chosen.click();
  await expect(chosen).toHaveText("None");
  await expect(applies).toHaveText("3");
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(applies).toHaveText("3");
});

test("checkbox All preserves disabled choices and keyboard skips disabled rows", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-checkboxmenu--disabled-option&viewMode=story",
  );
  await page.getByRole("button", { name: "Log level", exact: true }).click();
  const all = page.getByRole("menuitemcheckbox", {
    name: "All levels",
    exact: true,
  });
  await expect(all).toHaveAttribute("aria-checked", "mixed");
  await all.click();
  await all.click();
  await expect(page.getByLabel("Selected values")).toHaveText("info, error");
  await expect(page.getByLabel("Apply count")).toHaveText("0");
  await expect(
    page.getByRole("menuitemcheckbox", { name: "Errors", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("menuitemcheckbox", { name: "Warnings", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Selected values")).toHaveText("error");
  await expect(page.getByLabel("Apply count")).toHaveText("1");
});

test("radio focuses the selected row and commits one choice on focus departure", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-radiomenu--disabled-option&viewMode=story",
  );
  const trigger = page.getByRole("button", { name: "Sort order", exact: true });
  await trigger.press("ArrowDown");
  const oldest = page.getByRole("menuitemradio", {
    name: "Oldest first",
    exact: true,
  });
  const newest = page.getByRole("menuitemradio", {
    name: "Newest first",
    exact: true,
  });
  await expect(oldest).toBeFocused();
  await expect(
    page.getByRole("menuitemradio", { name: "Name", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("ArrowDown");
  await expect(newest).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(newest).toHaveAttribute("aria-checked", "true");
  await expect(oldest).toHaveAttribute("aria-checked", "false");
  await expect(
    page
      .getByRole("menuitemradio")
      .filter({ has: page.locator("[data-checked]") }),
  ).toHaveCount(1);
  await expect(page.getByLabel("Selected value")).toHaveText("oldest");
  await expect(page.getByLabel("Apply count")).toHaveText("0");
  await page.getByLabel("Selected value").evaluate((node) => {
    node.tabIndex = 0;
    node.focus();
  });
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(page.getByLabel("Selected value")).toHaveText("newest");
  await expect(page.getByLabel("Apply count")).toHaveText("1");
  await trigger.click();
  await expect(newest).toBeFocused();
  await newest.click();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Apply count")).toHaveText("1");
});

for (const kind of ["checkbox", "radio"] as const) {
  for (const dpr of [1, 1.5]) {
    test(`${kind} keeps indicators fixed, icons centered and insets equal at DPR ${dpr}`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        deviceScaleFactor: dpr,
        viewport: { width: 1440, height: 1000 },
      });
      const page = await context.newPage();
      try {
        await page.goto(
          `${test.info().project.use.baseURL}/iframe.html?id=components-${kind}menu--with-icons&viewMode=story`,
        );
        await page
          .getByRole("button", {
            name: kind === "checkbox" ? "Log level" : "Sort order",
            exact: true,
          })
          .click();
        const row = page.getByRole(`menuitem${kind}`, {
          name: kind === "checkbox" ? "Information" : "Newest first",
          exact: true,
        });
        const indicator = row
          .locator(".button-content > [aria-hidden]")
          .first();
        const content = row.locator("[data-choice-menu-content]");
        await row.hover();
        const before = (await indicator.boundingBox())!;
        const bounds = (await row.boundingBox())!;
        expect(
          Math.abs(before.x - bounds.x - (before.y - bounds.y)),
        ).toBeLessThan(0.05);
        expect(
          Math.abs(
            before.y -
              bounds.y -
              (bounds.y + bounds.height - before.y - before.height),
          ),
        ).toBeLessThan(0.05);
        const icon = (await content.locator("svg").boundingBox())!;
        expect(
          Math.abs(icon.y + icon.height / 2 - bounds.y - bounds.height / 2),
        ).toBeLessThan(0.05);
        await row.hover();
        await page.mouse.down();
        await expect
          .poll(() =>
            content.evaluate(
              (node) => new DOMMatrix(getComputedStyle(node).transform).a,
            ),
          )
          .toBeLessThan(0.999);
        expect(await indicator.boundingBox()).toEqual(before);
        await page.mouse.up();
        await expect
          .poll(() =>
            content.evaluate(
              (node) => new DOMMatrix(getComputedStyle(node).transform).a,
            ),
          )
          .toBe(1);
      } finally {
        await context.close();
      }
    });
  }
  test(`${kind} long lists scroll and disabled triggers do not open`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-${kind}menu--long-list&viewMode=story`,
    );
    await page
      .getByRole("button", {
        name: kind === "checkbox" ? "Log level" : "Sort order",
        exact: true,
      })
      .click();
    await page.keyboard.press("End");
    const last = page.getByRole(`menuitem${kind}`, {
      name: "Option 40",
      exact: true,
    });
    await expect(last).toBeFocused();
    await expect(last).toBeInViewport();
    await page.keyboard.press("Space");
    await page.keyboard.press("Escape");
    await expect(
      page.getByLabel(
        kind === "checkbox" ? "Selected values" : "Selected value",
      ),
    ).toContainText("option-40");
    await page.goto(
      `/iframe.html?id=components-${kind}menu--disabled&viewMode=story`,
    );
    await expect(page.getByRole("button")).toBeDisabled();
    await expect(page.getByRole("menu")).toHaveCount(0);
  });
}
