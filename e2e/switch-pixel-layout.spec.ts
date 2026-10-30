import { expect, test } from "@playwright/test";

for (const density of [1, 1.5]) {
  test.describe(`display density ${density}`, () => {
    test.use({ deviceScaleFactor: density });
    for (const zoom of density === 1 ? [1, 1.25, 1.5, 1.75, 2] : [1, 1.5]) {
      test(`error thumb is painted centrally at ${zoom * 100}% zoom`, async ({
        page,
      }, info) => {
        await page.goto(
          "/iframe.html?id=patterns-handlerfailures--selection&viewMode=story&args=kind:switch",
        );
        await page.evaluate((zoom) => {
          document.documentElement.style.zoom = String(zoom);
        }, zoom);
        const control = page.getByRole("switch");
        await control.evaluate((node) =>
          Object.assign(node.style, {
            position: "fixed",
            top: "100px",
            left: "100px",
          }),
        );
        await control.focus();
        await control.press("Space");
        await expect(page.getByRole("alert")).toBeVisible();
        await expect(control).toHaveAttribute("data-action-error-open", "true");
        await page.mouse.move(0, 0);
        await expect(control).toHaveCSS("background-color", "rgb(54, 54, 54)");
        await control.evaluate(async (node) => {
          await Promise.all(
            node
              .getAnimations({ subtree: true })
              .map((a) => a.finished.catch(() => {})),
          );
        });
        const bounds = (await control.boundingBox())!;
        const png = await control.screenshot({
          path: info.outputPath("switch-error.png"),
        });
        const paintedCenter = await page.evaluate(async (base64) => {
          const image = new Image();
          image.src = `data:image/png;base64,${base64}`;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext("2d")!;
          context.drawImage(image, 0, 0);
          const pixels = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          ).data;
          let coverage = 0,
            moment = 0;
          for (let y = 0; y < canvas.height; y++)
            for (let x = 0; x < canvas.width; x++) {
              const i = (y * canvas.width + x) * 4;
              const [r, g, b] = pixels.slice(i, i + 3);
              if (r !== g || g !== b || r <= 54 || r > 144) continue;
              const alpha = (r - 54) / 90;
              coverage += alpha;
              moment += (y + 0.5) * alpha;
            }
          return moment / coverage;
        }, png.toString("base64"));
        // Fixed integral viewport coordinates keep the screenshot origin exact.
        expect(
          Math.abs(paintedCenter - (bounds.height * density) / 2),
        ).toBeLessThan(0.15);
      });
    }
  });
}
