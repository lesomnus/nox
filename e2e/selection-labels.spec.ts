import { expect, test } from "@playwright/test";

for (const kind of ["checkbox", "radio"] as const) {
  for (const theme of ["dark", "light"]) {
    test(`${kind} label follows native disabled state in ${theme}`, async ({
      page,
    }) => {
      await page.goto(
        `/iframe.html?id=components-${kind}--labeled&viewMode=story&globals=theme:${theme}`,
      );
      const input = page.getByRole(kind);
      const color = () =>
        input.evaluate(
          (node) =>
            getComputedStyle((node as HTMLInputElement).labels![0]).color,
        );
      const enabledColor = await color();
      // Disabled fieldsets also disable controls without a disabled prop.
      await input.evaluate((node) => {
        const label = (node as HTMLInputElement).labels![0];
        const fieldset = document.createElement("fieldset");
        label.before(fieldset);
        fieldset.append(label);
        fieldset.disabled = true;
      });
      await expect(input).toBeDisabled();
      await expect.poll(color).not.toBe(enabledColor);
      await input.evaluate((node) => {
        node.closest("fieldset")!.disabled = false;
      });
      await expect(input).toBeEnabled();
      await expect.poll(color).toBe(enabledColor);
      await page.goto(
        `/iframe.html?id=components-${kind}--disabled-labeled&viewMode=story&globals=theme:${theme}`,
      );
      await expect(input).toBeDisabled();
      await expect.poll(color).not.toBe(enabledColor);
    });
  }
}
