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
