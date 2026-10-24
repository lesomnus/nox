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
    await trigger.click();
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
    await input.fill("Updated workspace");
    await input.press("Enter");
    await expect(trigger).toHaveText("Updated workspace");
    await trigger.click();
    await input.fill("Discarded change");
    await input.press("Escape");
    await expect(trigger).toHaveText("Updated workspace");
    await expect(trigger).toBeFocused();
  });
}
