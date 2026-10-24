import { expect, test, type Page } from "@playwright/test";

async function open(page: Page) {
  await page.goto(
    "/iframe.html?id=layout-splitlayout--crossing&viewMode=story",
  );
  await expect(page.locator("[data-split-junction]")).toHaveCount(1);
  await page.addStyleTag({
    content: ":root { --ui-muted: #00ff00; --ui-shade-54: #ff0000; }",
  });
}

async function pixels(page: Page, points: { x: number; y: number }[]) {
  const png = (await page.screenshot()).toString("base64");
  return page.evaluate(
    async ({ png, points }) => {
      const bitmap = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${png}`)).blob(),
      );
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d")!;
      context.drawImage(bitmap, 0, 0);
      const scale = bitmap.width / innerWidth;
      const colors = points.map(({ x, y }) =>
        [
          ...context.getImageData(
            Math.floor(x * scale),
            Math.floor(y * scale),
            1,
            1,
          ).data,
        ].slice(0, 3),
      );
      bitmap.close();
      return colors;
    },
    { png, points },
  );
}

for (const vertical of [false, true]) {
  test(`${vertical ? "vertical" : "horizontal"} hover paints an unbroken line across the crossing`, async ({
    page,
  }) => {
    await open(page);
    const box = (await page
      .locator(`[data-split-id="${vertical ? "outer" : "left"}"]`)
      .boundingBox())!;
    await page.mouse.move(
      box.x + box.width / 2,
      box.y + box.height * (vertical ? 0.25 : 0.5),
    );
    const joint = (await page.locator("[data-split-junction]").boundingBox())!;
    const cross = {
      x: joint.x + joint.width / 2,
      y: joint.y + joint.height / 2,
    };
    const colors = await pixels(
      page,
      Array.from({ length: 21 }, (_, i) => ({
        x: cross.x + (vertical ? 0 : i - 10),
        y: cross.y + (vertical ? i - 10 : 0),
      })),
    );
    expect(colors).toEqual(Array.from({ length: 21 }, () => [0, 255, 0]));
    await page.screenshot({
      path: `/tmp/nox-split-hover-${vertical ? "vertical" : "horizontal"}.png`,
    });
  });

  test(`${vertical ? "vertical" : "horizontal"} detachment is not overpainted by the nearby inactive junction`, async ({
    page,
  }) => {
    await open(page);
    const handle = page.locator(
      `[data-split-id="${vertical ? "outer" : "left"}"]`,
    );
    const box = (await handle.boundingBox())!;
    const position = {
      x: box.width / 2,
      y: box.height * (vertical ? 0.25 : 0.5),
    };
    await handle.dblclick({ position });
    await page.mouse.down();
    await page.mouse.move(
      box.x + position.x + (vertical ? 7 : 0),
      box.y + position.y + (vertical ? 0 : 7),
      { steps: 3 },
    );
    await expect(page.locator("[data-split-junction]")).toHaveCount(2);
    const active = page.locator('[data-split-junction][data-dragging="true"]');
    await expect(active).toHaveCount(1);
    const joint = (await active.boundingBox())!;
    const cross = {
      x: joint.x + joint.width / 2,
      y: joint.y + joint.height / 2,
    };
    const colors = await pixels(
      page,
      Array.from({ length: 9 }, (_, i) => ({
        x: cross.x + (vertical ? 0 : -i - 0.5),
        y: cross.y + (vertical ? -i - 0.5 : 0),
      })),
    );
    expect(colors).toEqual(Array.from({ length: 9 }, () => [0, 255, 0]));
    await page.screenshot({
      path: `/tmp/nox-split-detach-${vertical ? "vertical" : "horizontal"}.png`,
    });
    await page.mouse.up();
  });
}
