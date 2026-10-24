import { expect, test } from "@playwright/test";

for (const theme of ["dark", "light"]) {
  test(`portaled ActionMenu owns its ${theme} foreground and preserves trigger typography`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-actionmenu--more&viewMode=story&globals=theme:${theme}`,
    );
    await page.addStyleTag({
      content: "body { color: #000; font: 10px serif; }",
    });
    const trigger = page.getByRole("button", { name: "More", exact: true });
    await trigger.evaluate((node) => {
      node.style.font = "500 15px/1.5 monospace";
      node.style.letterSpacing = "0.3px";
    });
    await trigger.click();
    await page.mouse.move(0, 0);
    const menu = page.getByRole("menu", { name: "More", exact: true });
    const details = menu.getByRole("menuitem", {
      name: "Details",
      exact: true,
    });
    await expect(details).toHaveCSS(
      "color",
      theme === "dark" ? "rgb(237, 237, 237)" : "rgb(18, 18, 18)",
    );
    for (const property of [
      "fontFamily",
      "fontSize",
      "fontWeight",
      "lineHeight",
      "letterSpacing",
    ] as const) {
      const value = await trigger.evaluate(
        (node, property) => getComputedStyle(node)[property],
        property,
      );
      const actual = await details.evaluate(
        (node, property) => getComputedStyle(node)[property],
        property,
      );
      expect(actual).toBe(value);
    }
    await details.click();
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

test("More and language menus use separate popups with keyboard navigation", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=components-actionmenu--more&viewMode=story");
  const more = page.getByRole("button", { name: "More", exact: true });
  await more.press("ArrowDown");
  await expect(
    page.getByRole("menuitem", { name: "Details", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("menuitem", { name: "Stop", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(more).toBeFocused();

  await page.goto(
    "/iframe.html?id=components-actionmenu--language&viewMode=story",
  );
  const language = page.getByRole("button", { name: "Voice language" });
  await expect(language).toHaveText("English (US)");
  await language.click();
  const current = page.getByRole("menuitemcheckbox", {
    name: "English (US)",
    exact: true,
  });
  await expect(current).toHaveAttribute("aria-checked", "true");
  const triggerBox = await language.boundingBox();
  const menuBox = await page.getByRole("menu").boundingBox();
  expect(menuBox!.y).toBeGreaterThan(triggerBox!.y + triggerBox!.height);
  await page
    .getByRole("menuitemcheckbox", { name: "한국어", exact: true })
    .click();
  await expect(language).toHaveText("한국어");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await language.click();
  await expect(
    page.getByRole("menuitemcheckbox", { name: "한국어", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
});
