import { expect, test } from "@playwright/test";

for (const [story, text, digits] of [
  ["integer", "0001", 4],
  ["three-digits", "007", 3],
  ["three-digit-overflow", ">99", 3],
] as const) {
  test(`integer ${story} keeps its configured cells and accessible value`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-compactnumber--${story}&viewMode=story`,
    );
    const number = page.locator('[data-mode="integer"]');
    await expect(number).toHaveText(text);
    await expect(number).toHaveAttribute(
      "aria-label",
      story === "three-digit-overflow"
        ? "1234"
        : story === "three-digits"
          ? "7"
          : "1",
    );
    await expect(number).toHaveCSS("--compact-number-digits", String(digits));
    if (story === "three-digits") {
      const leading = number.locator(":scope > span").first();
      const value = number.locator(":scope > span").nth(1);
      await expect(leading).toHaveText("00");
      expect(
        await leading.evaluate((el) => getComputedStyle(el).color),
      ).not.toBe(await value.evaluate((el) => getComputedStyle(el).color));
      const before = (await number.boundingBox())!.width;
      await page.goto(
        "/iframe.html?id=components-compactnumber--three-digits&viewMode=story&args=value:42",
      );
      await expect(number).toHaveText("042");
      expect((await number.boundingBox())!.width).toBeCloseTo(before, 2);
    }
  });
}

for (const theme of ["dark", "light"] as const) {
  for (const mode of ["compact", "integer"] as const) {
    test(`${theme} ${mode} zero and muted values use the intermediate color without changing cells`, async ({
      page,
    }) => {
      const open = async (story: string) => {
        await page.goto(
          `/iframe.html?id=components-compactnumber--${story}&viewMode=story`,
        );
        const number = page.locator(`[data-mode="${mode}"]`);
        await expect(number).toBeVisible();
        await page.evaluate((theme) => {
          document.documentElement.dataset.uiTheme = theme;
          document.documentElement.dataset.theme = theme;
        }, theme);
        return number;
      };
      const normal = await open(mode === "integer" ? "three-digits" : "single");
      const colors = await normal.evaluate((el) => ({
        value: getComputedStyle(el).getPropertyValue("--ui-text-value"),
        intermediate: getComputedStyle(el).getPropertyValue(
          "--ui-text-separator",
        ),
        leading: getComputedStyle(el).getPropertyValue("--ui-text-leading"),
      }));
      const width = (await normal.boundingBox())!.width;
      const normalColor = await normal.evaluate(
        (el) => getComputedStyle(el).color,
      );
      const leadingColor = await normal
        .locator(":scope > span")
        .first()
        .evaluate((el) => getComputedStyle(el).color);
      expect(colors.value).not.toBe(colors.intermediate);
      expect(colors.leading).not.toBe(colors.intermediate);

      let intermediateColor: string | undefined;
      for (const [story, text, label] of mode === "integer"
        ? [
            ["integer-zero", "000", "0"],
            ["muted-integer", "007", "7"],
          ]
        : [
            ["zero", "0000·", "0"],
            ["muted", "1.23K", "1230"],
          ]) {
        const number = await open(story);
        await expect(number).toHaveText(text);
        await expect(number).toHaveAttribute("aria-label", label);
        const value = number.locator(":scope > span").nth(1);
        const valueColor = await value.evaluate(
          (el) => getComputedStyle(el).color,
        );
        expect(valueColor).not.toBe(normalColor);
        expect(valueColor).not.toBe(leadingColor);
        if (intermediateColor) expect(valueColor).toBe(intermediateColor);
        intermediateColor = valueColor;
        await expect(number.locator(":scope > span").first()).toHaveCSS(
          "color",
          leadingColor,
        );
        if (mode === "compact")
          await expect(number.locator(":scope > span").last()).toHaveCSS(
            "color",
            valueColor,
          );
        expect((await number.boundingBox())!.width).toBeCloseTo(width, 2);
      }
    });
  }
}
