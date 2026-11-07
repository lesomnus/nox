import { expect, test, type Locator } from "@playwright/test";

async function color(control: Locator) {
  return control.evaluate((node) => {
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.fillStyle = getComputedStyle(node).backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
  });
}
async function settle(row: Locator) {
  await row.evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .filter((animation) => animation instanceof CSSTransition)
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
}

for (const theme of ["dark", "light"] as const) {
  test(`row-aware buttons preserve their bases and accumulate selection while hovered in ${theme}`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-table--row-aware-buttons&viewMode=story&globals=theme:${theme}`,
    );
    const table = page.getByRole("table", { name: "Row-aware buttons" });
    const direction = theme === "dark" ? 1 : -1;
    const hoverDeltas: number[] = [];
    for (const name of ["Default base", "Custom base"]) {
      const row = table.getByRole("row", { name: new RegExp(name) });
      const button = row.getByRole("button", { name: "Action", exact: true });
      const link = row.getByRole("link", { name: "Workspace", exact: true });
      const independent = row.getByRole("button", { name: "Independent" });
      await page.mouse.move(0, 0);
      const base = await color(button),
        standalone = await color(independent);
      expect(await color(link)).toEqual(base);
      const duration = await button.evaluate(
        (node) => getComputedStyle(node).transitionDuration,
      );
      await expect(row).toHaveCSS("transition-duration", duration);
      await row.getByRole("rowheader", { name }).hover();
      await settle(row);
      const hover = await color(button);
      expect(direction * (hover[0]! - base[0]!)).toBeGreaterThan(0);
      expect(await color(link)).toEqual(hover);
      expect(await color(independent)).toEqual(standalone);
      hoverDeltas.push(hover[0]! - base[0]!);
      // Keep the pointer in this row while selection changes by keyboard.
      const checkbox = row.getByRole("checkbox", { name: `Select ${name}` });
      await checkbox.focus();
      await checkbox.press("Space");
      await expect(row).toHaveAttribute("aria-selected", "true");
      await settle(row);
      const selected = await color(button);
      expect(direction * (selected[0]! - hover[0]!)).toBeGreaterThan(0);
      expect(await color(link)).toEqual(selected);
      expect(await color(independent)).toEqual(standalone);
      await button.hover();
      await settle(row);
      expect(
        direction * ((await color(button))[0]! - selected[0]!),
      ).toBeGreaterThan(0);
      await link.hover();
      await settle(row);
      expect(
        direction * ((await color(link))[0]! - selected[0]!),
      ).toBeGreaterThan(0);
      await checkbox.focus();
      await checkbox.press("Space");
      await row.getByRole("rowheader", { name }).hover();
      await settle(row);
      expect(await color(button)).toEqual(hover);
    }
    expect(hoverDeltas[0]).toBe(hoverDeltas[1]);
  });
}

test("row-aware background feedback respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    "/iframe.html?id=components-table--row-aware-buttons&viewMode=story",
  );
  const row = page.getByRole("row", { name: /Default base/ });
  await expect(row).toHaveCSS("transition-duration", "0s");
  await expect(
    row.getByRole("button", { name: "Action", exact: true }),
  ).toHaveCSS("transition-duration", "0s");
});
