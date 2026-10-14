import { expect, test } from "@playwright/test";

test("dialog body blurs the page after its entrance animation finishes", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-confirmationdialog--blurred-background&viewMode=story",
  );
  await page.getByRole("button", { name: "Open confirmation" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
  });
  const body = dialog.locator(".card-body");
  const variation = async () => {
    const png = (await body.screenshot()).toString("base64");
    return page.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      const row = context.getImageData(24, 10, image.width - 48, 1).data;
      const values = Array.from(row).filter((_, index) => index % 4 === 0);
      const mean =
        values.reduce((sum, value) => sum + value, 0) / values.length;
      return Math.sqrt(
        values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
          values.length,
      );
    }, png);
  };
  const blurred = await variation();
  await body.evaluate((node) => {
    node.style.backdropFilter = "none";
    node.style.setProperty("-webkit-backdrop-filter", "none");
  });
  const sharp = await variation();
  expect(sharp).toBeGreaterThan(5);
  expect(blurred).toBeLessThan(sharp / 4);
});
