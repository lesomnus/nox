import { expect, test, type Locator, type Page } from "@playwright/test";

async function expectLabelOnlyPress(page: Page, row: Locator) {
  await row.evaluate(async (node) => {
    const animations: Animation[] = [];
    for (
      let parent: Element | null = node;
      parent;
      parent = parent.parentElement
    )
      animations.push(...parent.getAnimations());
    await Promise.all(
      animations
        .filter(
          (animation) => animation.effect?.getTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
  const icon = row.locator("[data-menu-item-icon]");
  const label = row
    .locator(
      ".button-content > :not([data-menu-item-icon]):not([data-menu-item-trailing])",
    )
    .first();
  await expect(label).toHaveCSS("transform", "none");
  const iconBefore = (await icon.boundingBox())!;
  const labelBefore = (await label.boundingBox())!;
  const gap = await row.evaluate((node) =>
    parseFloat(
      getComputedStyle(node.querySelector(".button-content")!).columnGap,
    ),
  );
  expect(labelBefore.x - iconBefore.x - iconBefore.width).toBeCloseTo(gap, 1);
  await row.hover();
  await page.mouse.down();
  try {
    await expect
      .poll(async () => (await label.boundingBox())!.width)
      .toBeLessThan(labelBefore.width);
    expect(await icon.boundingBox()).toEqual(iconBefore);
    await expect(row.locator(".button-content")).toHaveCSS("transform", "none");
  } finally {
    await page.mouse.move(0, 0);
    await page.mouse.up();
  }
}

for (const story of ["with-icons", "searchable-icons"]) {
  for (const size of [undefined, 22]) {
    test(`${story} uses the same icon size token in both menus${size ? " with an override" : ""}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(
        `/iframe.html?id=menus-features--${story}&viewMode=story`,
      );
      if (size)
        await page.addStyleTag({
          content: `:root { --ui-icon-size-small: ${size}px; }`,
        });
      const expected =
        size ??
        (await page.evaluate(() =>
          parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--ui-icon-size-small",
            ),
          ),
        ));
      const value = page.getByRole("combobox", { name: "Effort", exact: true });
      await expect(value.locator("svg")).toHaveCSS("width", `${expected}px`);
      await expect(value.locator("svg")).toHaveCSS("height", `${expected}px`);
      await page
        .getByRole("button", { name: "Effort actions", exact: true })
        .click();
      const action = page.getByRole("menu", {
        name: "Effort actions",
        exact: true,
      });
      for (const icon of await action.locator("svg").all()) {
        await expect(icon).toHaveCSS("width", `${expected}px`);
        await expect(icon).toHaveCSS("height", `${expected}px`);
      }
      const actionRow = action.getByRole("menuitemcheckbox", {
        name: "Low",
        exact: true,
      });
      const actionHeight = (await actionRow.boundingBox())!.height;
      await expectLabelOnlyPress(page, actionRow);
      const actionGap = await actionRow
        .locator(".button-content")
        .evaluate((node) => getComputedStyle(node).gap);
      const actionGroup = await action
        .locator("[data-menu-group-label]")
        .first()
        .evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            fontSize: style.fontSize,
            lineHeight: style.lineHeight,
            padding: style.padding,
          };
        });
      await page.keyboard.press("Escape");
      await value.click();
      const choices = page.getByRole("listbox", {
        name: "Effort choices",
        exact: true,
      });
      for (const icon of await page.locator(".setting-menu svg").all()) {
        await expect(icon).toHaveCSS("width", `${expected}px`);
        await expect(icon).toHaveCSS("height", `${expected}px`);
      }
      const valueRow = choices.getByRole("option", {
        name: "Low",
        exact: true,
      });
      await expectLabelOnlyPress(page, valueRow);
      expect(
        await choices
          .locator("[data-menu-group-label]")
          .first()
          .evaluate((node) => {
            const style = getComputedStyle(node);
            return {
              fontSize: style.fontSize,
              lineHeight: style.lineHeight,
              padding: style.padding,
            };
          }),
      ).toEqual(actionGroup);
      expect((await valueRow.boundingBox())!.height).toBe(actionHeight);
      expect(
        await valueRow
          .locator(".button-content")
          .evaluate((node) => getComputedStyle(node).gap),
      ).toBe(actionGap);
      await valueRow.click();
      await expect(value).toHaveText("Low");
      await expect(value.locator("svg")).toHaveCSS("width", `${expected}px`);
    });
  }
}
