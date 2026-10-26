import { expect, test } from "@playwright/test";

test("controlled DOM anchors preserve their description and dismiss through the host", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-popover--controlled-anchor&viewMode=story",
  );
  const trigger = page.getByRole("button", {
    name: "File details",
    exact: true,
  });
  await trigger.click();
  const popup = page.getByRole("tooltip");
  await expect(popup).toBeVisible();
  const description = await trigger.getAttribute("aria-describedby");
  expect(description?.split(" ")).toContain("existing-description");
  expect(description?.split(" ")).toContain(await popup.getAttribute("id"));
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await expect(trigger).toHaveAttribute(
    "aria-describedby",
    "existing-description",
  );
  await expect(trigger).toBeFocused();
});

test("rich content is portaled above native dialog content", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-popover--rich-content&viewMode=story",
  );
  await page.getByText("report.md", { exact: true }).hover();
  await expect(
    page.getByRole("tooltip").getByRole("img", { name: "12345", exact: true }),
  ).toHaveText("12.3K");
  await page.goto(
    "/iframe.html?id=components-popover--in-dialog&viewMode=story",
  );
  await page.getByRole("button", { name: "Open dialog", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Popover in dialog",
    exact: true,
  });
  await dialog.getByText("Nested value", { exact: true }).hover();
  await expect(dialog.getByRole("tooltip")).toBeVisible();
  await expect(dialog.getByRole("tooltip")).toHaveText(
    "1a2b3c4d-5e6f-7788-9900-aabbccddeeff",
  );
  await page.keyboard.press("Escape");
  await expect(dialog.getByRole("tooltip")).toHaveCount(0);
  await expect(dialog).toBeVisible();
});

test("controlled in-place popovers hide and restore their original DOM anchor", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-popover--controlled-anchor&viewMode=story&args=placement:in-place",
  );
  const trigger = page.getByRole("button", {
    name: "File details",
    exact: true,
  });
  const before = await trigger.boundingBox();
  await trigger.click();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await expect(trigger).toHaveCSS("opacity", "0");
  expect(await trigger.boundingBox()).toEqual(before);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(trigger).toHaveCSS("opacity", "1");
});

for (const [name, placement] of [
  ["default", "top-start"],
  ["bottom-end", "bottom-end"],
]) {
  test(`direct Popover ${placement} aligns to the abbreviated text`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-popover--${name}&viewMode=story`,
    );
    const anchor = page.locator('[tabindex="0"]');
    await anchor.focus();
    const hint = page.getByRole("tooltip");
    await expect(hint).toBeVisible();
    await expect(hint).toHaveAttribute("data-placement", placement);
    const source = (await anchor.boundingBox())!,
      box = (await hint.boundingBox())!;
    if (placement === "top-start") {
      expect(box.x).toBeCloseTo(source.x, 1);
      expect(source.y - box.y - box.height).toBeCloseTo(8, 1);
    } else {
      expect(box.x + box.width).toBeCloseTo(source.x + source.width, 1);
      expect(box.y - source.y - source.height).toBeCloseTo(8, 1);
    }
    expect(
      await hint.evaluate((el) => el.parentElement === document.body),
    ).toBe(true);
    await anchor.press("Escape");
    await expect(hint).toHaveCount(0);
    await expect(anchor).toBeFocused();
  });
}

for (const scale of [1, 1.25, 1.5, 2]) {
  test.describe(`in-place hint at device scale ${scale}`, () => {
    test.use({ deviceScaleFactor: scale });
    test("paints one complete surface without exposing the original edges", async ({
      page,
    }) => {
      await page.goto(
        "/iframe.html?id=components-popover--in-place&viewMode=story",
      );
      await page.evaluate(() => document.fonts.ready);
      const anchor = page.locator("[tabindex='0']");
      const before = (await anchor.boundingBox())!;
      await anchor.hover();
      const hint = page.getByRole("tooltip");
      await expect(hint).toHaveText("1a2b3c4d-5e6f-7788-9900-aabbccddeeff");
      expect(await anchor.boundingBox()).toEqual(before);
      await expect(hint).toHaveCSS("clip-path", "none");
      const frame = (await hint.boundingBox())!;
      const clip = {
        x: Math.max(0, frame.x - 12),
        y: Math.max(0, frame.y - 12),
        width: frame.width + 24,
        height: frame.height + 24,
      };
      const actual = await page.screenshot({ clip });
      // Even a conspicuous source outline must not bleed through or around the overlay.
      await anchor.evaluate((element) => {
        element.style.outline = "8px solid magenta";
        element.style.background = "magenta";
      });
      expect(await page.screenshot({ clip })).toEqual(actual);
      await page.mouse.move(0, 0);
      await expect(hint).toHaveCount(0);
      await anchor.evaluate((element) => {
        element.style.outline = "";
        element.style.background = "";
      });
      await anchor.focus();
      await expect(hint).toBeVisible();
      await anchor.press("Escape");
      await expect(hint).toHaveCount(0);
      await expect(anchor).toBeFocused();
      await expect(anchor).toHaveCSS("opacity", "1");
    });
  });
}
