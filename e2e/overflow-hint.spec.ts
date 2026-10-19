import { expect, test } from "@playwright/test";

for (const scale of [1, 1.25, 1.5, 2]) {
  test.describe(`in-place hint at device scale ${scale}`, () => {
    test.use({ deviceScaleFactor: scale });
    test("does not clip the first character after the original prefix", async ({
      page,
    }, testInfo) => {
      await page.goto(
        "/iframe.html?id=components-overflowhint--in-place&viewMode=story",
      );
      // Hold background contrast constant to isolate clipped glyph ink.
      await page.addStyleTag({
        content: ":root { --ui-overflow-hint-background: var(--ui-shade-24); }",
      });
      await page.evaluate(() => document.fonts.ready);
      const anchor = page.locator("[tabindex='0']");
      await anchor.hover();
      const hint = page.getByRole("tooltip");
      await expect(hint).toBeVisible();
      const clip = await hint.evaluate((element) => {
        const anchor = document.querySelector("[data-prefix-preserved]")!;
        const text = document
          .createTreeWalker(element, NodeFilter.SHOW_TEXT)
          .nextNode()!;
        const offset = anchor.textContent!.length;
        const range = document.createRange();
        range.setStart(text, offset);
        range.setEnd(text, offset + 1);
        const { x, y, width, height } = range.getBoundingClientRect();
        return { x, y, width, height };
      });
      const actual = await page.screenshot({
        clip,
        path: testInfo.outputPath("actual.png"),
      });
      // Compare against the same glyph with no prefix cutout, at the same position.
      await hint.evaluate((element) => (element.style.clipPath = "none"));
      const whole = await page.screenshot({
        clip,
        path: testInfo.outputPath("whole.png"),
      });
      const difference = await page.evaluate(
        async ([actual, whole]) => {
          async function pixels(base64: string) {
            const image = new Image();
            image.src = `data:image/png;base64,${base64}`;
            await image.decode();
            const canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext("2d")!;
            context.drawImage(image, 0, 0);
            return context.getImageData(0, 0, image.width, image.height).data;
          }
          const [a, b] = await Promise.all([pixels(actual), pixels(whole)]);
          let maximum = 0;
          for (let i = 0; i < a.length; i++)
            maximum = Math.max(maximum, Math.abs(a[i] - b[i]));
          return maximum;
        },
        [actual.toString("base64"), whole.toString("base64")],
      );
      // Mask-edge antialiasing can round a background channel by one level.
      expect(
        difference,
        "the continuation glyph must remain fully painted",
      ).toBeLessThanOrEqual(1);
    });
  });
}
