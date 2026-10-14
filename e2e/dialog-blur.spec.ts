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
  const card = dialog.locator("[data-dialog-card]");
  const variation = async (gutter = false) => {
    const region = gutter
      ? await card.evaluate((node) => {
          const body = node.querySelector<HTMLElement>(".card-body")!;
          const bounds = node.getBoundingClientRect();
          const content = body.getBoundingClientRect();
          return {
            x: Math.floor(
              parseFloat(getComputedStyle(node).borderLeftWidth) +
                parseFloat(getComputedStyle(body).marginLeft) / 2,
            ),
            y: Math.ceil(content.top - bounds.top + 12),
            width: 1,
            height: Math.floor(content.height - 24),
          };
        })
      : null;
    const png = (await (gutter ? card : body).screenshot()).toString("base64");
    return page.evaluate(
      async ({ base64, region }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        const { x, y, width, height } = region ?? {
          x: 24,
          y: 10,
          width: image.width - 48,
          height: 1,
        };
        const row = context.getImageData(x, y, width, height).data;
        const values = Array.from(row).filter((_, index) => index % 4 === 0);
        const mean =
          values.reduce((sum, value) => sum + value, 0) / values.length;
        return Math.sqrt(
          values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
            values.length,
        );
      },
      { base64: png, region },
    );
  };
  const checkBlur = async (gutter = false) => {
    const blurred = await variation(gutter);
    await card.evaluate((node) => {
      node.style.setProperty("--ui-dialog-blur", "0px");
    });
    const sharp = await variation(gutter);
    await card.evaluate((node) => {
      node.style.removeProperty("--ui-dialog-blur");
    });
    expect(sharp).toBeGreaterThan(5);
    expect(blurred).toBeLessThan(sharp / 4);
  };
  await checkBlur();
  await surface.evaluate((node) => {
    node.getAnimations().forEach((animation) => animation.finish());
  });
  await checkBlur();
  // The surrounding frame uses the header/footer tint, without body blur.
  await page
    .locator('[aria-hidden="true"][style*="repeating-linear-gradient"]')
    .evaluate((node) => {
      (node as HTMLElement).style.background =
        "repeating-linear-gradient(0deg, #141414 0 8px, #888 8px 16px)";
    });
  const gapVariation = await variation(true);
  await card.evaluate((node) =>
    node.style.setProperty("--ui-dialog-blur", "0px"),
  );
  expect(await variation(true)).toBeCloseTo(gapVariation, 1);
  await card.evaluate((node) => node.style.removeProperty("--ui-dialog-blur"));
  await page
    .locator('[aria-hidden="true"][style*="repeating-linear-gradient"]')
    .evaluate((node) => {
      (node as HTMLElement).style.background = "rgb(80, 80, 80)";
    });
  // Compare the tints over an identical backdrop, away from the launch text.
  await page
    .getByText("Open confirmation", { exact: true })
    .evaluate((node) => {
      (node as HTMLElement).style.visibility = "hidden";
    });
  const samples = await card.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    const body = node.querySelector<HTMLElement>(".card-body")!;
    const content = body.getBoundingClientRect();
    const heading = node
      .querySelector(".card-heading")!
      .getBoundingClientRect();
    const footer = node.querySelector(".card-footer")!.getBoundingClientRect();
    return {
      gap: [
        Math.floor(
          parseFloat(getComputedStyle(node).borderLeftWidth) +
            parseFloat(getComputedStyle(body).marginLeft) / 2,
        ),
        Math.floor(content.top - bounds.top + content.height / 2),
      ],
      header: [
        Math.floor(bounds.width / 2),
        Math.floor(heading.top - bounds.top + heading.height / 2),
      ],
      footer: [16, Math.floor(footer.top - bounds.top + footer.height / 2)],
    };
  });
  const png = (await card.screenshot()).toString("base64");
  const colors = await page.evaluate(
    async ({ png, samples }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      return Object.fromEntries(
        Object.entries(samples).map(([key, [x, y]]) => [
          key,
          [...context.getImageData(x, y, 1, 1).data],
        ]),
      );
    },
    { png, samples },
  );
  expect(colors.gap).toEqual(colors.header);
  expect(colors.gap).toEqual(colors.footer);
});
