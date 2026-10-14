import { expect, test } from "@playwright/test";

test("dialog body blurs the page during and after its entrance motion", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-confirmationdialog--blurred-background&viewMode=story",
  );
  await page.addStyleTag({
    content: "[data-anchored] { animation-duration: 2s !important; }",
  });
  await page.getByRole("button", { name: "Open confirmation" }).click();
  const dialog = page.getByRole("dialog");
  const surface = dialog.locator("[data-anchored]");
  await surface.evaluate((node) => {
    const animation = node.getAnimations()[0];
    if (!animation) throw new Error("Expected entrance motion");
    animation.pause();
    animation.currentTime = 800;
  });
  await expect(surface).toHaveCSS("opacity", "1");
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
  const checkBlur = async () => {
    const blurred = await variation();
    await body.evaluate((node) => {
      node.style.backdropFilter = "none";
      node.style.setProperty("-webkit-backdrop-filter", "none");
    });
    const sharp = await variation();
    await body.evaluate((node) => {
      node.style.removeProperty("backdrop-filter");
      node.style.removeProperty("-webkit-backdrop-filter");
    });
    expect(sharp).toBeGreaterThan(5);
    expect(blurred).toBeLessThan(sharp / 4);
  };
  await checkBlur();
  await surface.evaluate((node) => {
    node.getAnimations().forEach((animation) => animation.finish());
  });
  await checkBlur();
});
