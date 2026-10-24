import { expect, test } from "@playwright/test";

test("ValueMenu paints equal row insets after its entrance at fractional zoom", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto(
    "/iframe.html?id=components-actionmenu--shared-surface&viewMode=story",
  );
  await page.getByRole("combobox", { name: "Effort" }).click();
  const menu = page.getByRole("listbox", { name: "Effort choices" });
  await menu.evaluate((node) => {
    Object.assign(node.style, { zoom: "1.5", left: "19.5px", top: "10.5px" });
    node.style.setProperty("--menu-width", "455.5px");
  });
  await menu.getByRole("option", { name: "high", exact: true }).hover();
  await menu.evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
  const geometry = await menu.evaluate((node) => {
    const row = node.querySelector<HTMLElement>('[data-option-value="high"]')!;
    const bounds = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const rgb = (color: string) =>
      [...color.matchAll(/[\d.]+/g)]
        .slice(0, 3)
        .map((match) => Number(match[0]));
    return {
      menu: bounds(node),
      row: bounds(row),
      border: rgb(getComputedStyle(node).borderLeftColor),
      fill: rgb(getComputedStyle(row).backgroundColor),
    };
  });
  const screenshot = await page.screenshot({
    path: "test-results/value-menu-fractional-insets.png",
  });
  const gaps = await page.evaluate(
    async ({ png, geometry }) => {
      const bitmap = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${png}`)).blob(),
      );
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d")!;
      context.drawImage(bitmap, 0, 0);
      const scale = bitmap.width / window.innerWidth;
      const y = Math.floor((geometry.row.y + geometry.row.height / 2) * scale);
      const pixels = context.getImageData(0, y, bitmap.width, 1).data;
      const frame: number[] = [],
        fill: number[] = [];
      for (
        let x = Math.floor(geometry.menu.x * scale);
        x <= Math.ceil((geometry.menu.x + geometry.menu.width) * scale);
        x++
      ) {
        const matches = (color: number[]) =>
          color.every((value, channel) => pixels[x * 4 + channel] === value);
        if (matches(geometry.border)) frame.push(x);
        if (matches(geometry.fill)) fill.push(x);
      }
      bitmap.close();
      const left = frame[0],
        right = frame.at(-1)!;
      const interior = fill.filter((x) => x > left && x < right);
      return {
        left: interior[0] - left - 1,
        right: right - interior.at(-1)! - 1,
      };
    },
    { png: screenshot.toString("base64"), geometry },
  );
  expect(gaps.left).toBeGreaterThan(0);
  expect(gaps.right).toBe(gaps.left);
});

for (const kind of ["action", "value"] as const) {
  test(`${kind} menu stays interactive inside the nearest native dialog`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-${kind}menu--${kind === "action" ? "more" : "default"}&viewMode=story`,
    );
    const trigger =
      kind === "action"
        ? page.getByRole("button", { name: "More", exact: true })
        : page.getByRole("combobox", { name: "Effort", exact: true });
    await expect(trigger).toBeVisible();
    await page.evaluate(() => {
      const dialog = document.createElement("dialog");
      const content = document.querySelector(".ui-showcase")!;
      content.parentElement!.append(dialog);
      dialog.append(content);
      dialog.showModal();
    });
    await trigger.click();
    const menu = page.getByRole(kind === "action" ? "menu" : "listbox");
    await expect(menu).toBeVisible();
    expect(await menu.evaluate((node) => node.parentElement?.tagName)).toBe(
      "DIALOG",
    );
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator("dialog")).toBeVisible();
    await trigger.click();
    await menu
      .getByRole(kind === "action" ? "menuitem" : "option", {
        name: kind === "action" ? "Details" : "high",
        exact: true,
      })
      .click();
    await expect(menu).toHaveCount(0);
    if (kind === "value") await expect(trigger).toHaveText("high");
    await expect(trigger).toBeFocused();
  });
}
