import { expect, test } from "@playwright/test";

for (const { theme, customSpacing } of [
  { theme: "dark", customSpacing: false },
  { theme: "light", customSpacing: false },
  { theme: "dark", customSpacing: true },
]) {
  test(`editable values align with plain text in ${theme}${customSpacing ? " with custom spacing" : ""}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(
      `/iframe.html?id=components-descriptionlist--editable&viewMode=story&globals=theme:${theme}`,
    );
    const list = page.locator("dl");
    if (customSpacing) {
      await list.evaluate((el) => {
        el.style.setProperty("--ui-space", "8px");
        el.style.setProperty("--ui-control-inline-inset", "10px");
      });
    }
    const metrics = await list.evaluate((el) => {
      const [editable, plain] = el.querySelectorAll("dd");
      const control = editable.querySelector("button")!;
      const content = control.querySelector(".button-content")!;
      const textRect = (node: Element) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        const { x, y, height } = range.getBoundingClientRect();
        return { x, y, height };
      };
      return {
        editable: editable.getBoundingClientRect().toJSON(),
        plain: plain.getBoundingClientRect().toJSON(),
        editableText: textRect(content),
        plainText: textRect(plain),
        control: control.getBoundingClientRect().toJSON(),
        content: content.getBoundingClientRect().toJSON(),
      };
    });
    expect(metrics.editable.height).toBeCloseTo(metrics.plain.height, 2);
    expect(metrics.editableText.x - metrics.editable.x).toBeCloseTo(
      metrics.plainText.x - metrics.plain.x,
      2,
    );
    expect(metrics.editableText.y).toBeCloseTo(metrics.plainText.y, 2);
    expect(metrics.editableText.height).toBeCloseTo(
      metrics.plainText.height,
      2,
    );
    // The frame retains its padding and is drawn outside the value's bounds.
    expect(metrics.control.x).toBeLessThan(metrics.editable.x);
    expect(metrics.control.y).toBeLessThan(metrics.editable.y);

    const trigger = page.getByRole("button", { name: "Edit Name" });
    const label = list.locator("dt").first();
    const labelBox = (await label.boundingBox())!;
    const labelStyle = await label.evaluate((el) => ({
      color: getComputedStyle(el).color,
      font: getComputedStyle(el).font,
    }));
    await trigger.click();
    const foreground = page.locator(
      '.editable-value-dialog [data-dialog-trigger="true"]',
    );
    const foregroundLabel = foreground.locator("dt");
    await expect(label).toHaveCSS("visibility", "hidden");
    await expect(foreground).toHaveAttribute("aria-hidden", "true");
    await expect(foreground).toHaveCSS("opacity", "1");
    await expect(foregroundLabel).toHaveText("Name");
    await expect(foregroundLabel).toHaveCSS("color", labelStyle.color);
    await expect(foregroundLabel).toHaveCSS("font", labelStyle.font);
    await expect
      .poll(async () => {
        const box = (await foreground.boundingBox())!;
        return Math.max(
          Math.abs(box.x - labelBox.x),
          Math.abs(box.y - labelBox.y),
        );
      })
      .toBeLessThan(0.1);
    const input = page.getByRole("textbox", { name: "Name", exact: true });
    const inputBox = (await input.boundingBox())!;
    for (const key of ["x", "y", "width", "height"] as const)
      expect(inputBox[key]).toBeCloseTo(metrics.control[key], 2);
    const padding = await input.evaluate((el) => ({
      left: parseFloat(getComputedStyle(el).paddingLeft),
      top: parseFloat(getComputedStyle(el).paddingTop),
    }));
    expect(inputBox.x + padding.left).toBeCloseTo(metrics.content.x, 2);
    expect(inputBox.y + padding.top).toBeCloseTo(metrics.content.y, 2);
    await foreground.click();
    await expect(input).toBeFocused();
    await page.setViewportSize({ width: 760, height: 520 });
    await expect
      .poll(async () => {
        const source = await label.evaluate((el) => ({
          x: el.getBoundingClientRect().x,
          y: el.getBoundingClientRect().y,
        }));
        const box = (await foreground.boundingBox())!;
        return Math.max(Math.abs(box.x - source.x), Math.abs(box.y - source.y));
      })
      .toBeLessThan(0.1);
    await input.fill("Updated workspace");
    await input.press("Enter");
    await expect(trigger).toHaveText("Updated workspace");
    await expect(label).toBeVisible();
    await expect(foreground).toHaveCount(0);
    await trigger.click();
    await input.fill("Discarded change");
    await input.press("Escape");
    await expect(trigger).toHaveText("Updated workspace");
    await expect(label).toBeVisible();
    await expect(foreground).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

test("standalone editing does not add a foreground label when there is no visible field label", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=integration-standalone--editable&viewMode=story",
  );
  const trigger = page.getByRole("button", { name: "Edit Name" });
  await trigger.click();
  await expect(
    page.locator('.editable-value-dialog [data-dialog-trigger="true"]'),
  ).toHaveCount(0);
  const input = page.getByRole("textbox", { name: "Name", exact: true });
  await expect(input).toBeFocused();
  await input.press("Escape");
  await expect(trigger).toBeFocused();
});
