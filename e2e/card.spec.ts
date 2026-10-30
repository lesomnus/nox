import { expect, test } from "@playwright/test";

for (const theme of ["dark", "light"]) {
  test(`headerless Card keeps matching top and horizontal body insets in ${theme}`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-card--headerless&viewMode=story&globals=theme:${theme}`,
    );
    const card = page.locator("section.floating-card");
    await expect(card.locator(".card-heading")).toHaveCount(0);
    await expect(card.locator(".card-body")).toHaveCSS("padding", "0px");
    const gaps = await card.evaluate((node) => {
      const outer = node.getBoundingClientRect();
      const inner = node.querySelector(".card-body")!.getBoundingClientRect();
      const css = getComputedStyle(node);
      return {
        top: inner.top - outer.top - parseFloat(css.borderTopWidth),
        left: inner.left - outer.left - parseFloat(css.borderLeftWidth),
        right: outer.right - inner.right - parseFloat(css.borderRightWidth),
      };
    });
    expect(gaps.top).toBeGreaterThan(0);
    expect(gaps.top).toBeCloseTo(gaps.left, 5);
    expect(gaps.top).toBeCloseTo(gaps.right, 5);
  });
}

for (const theme of ["dark", "light"]) {
  test(`Card owns its surface and preserves action variants in ${theme}`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-card--default&viewMode=story&globals=theme:${theme}`,
    );
    const card = page.locator("section.floating-card");
    await expect(card).toBeVisible();
    await expect(card.locator(".card-heading")).toHaveText(
      "Workspace information",
    );
    await expect(card.locator(".card-body")).toHaveCSS(
      "background-color",
      theme === "dark" ? "rgb(28, 28, 28)" : "rgb(244, 244, 244)",
    );
    await expect(card).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(
      card.getByRole("button", { name: "Save", exact: true }),
    ).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const geometry = await card.evaluate((node) => {
      const body = node.querySelector<HTMLElement>(".card-body")!;
      const outer = node.getBoundingClientRect(),
        inner = body.getBoundingClientRect();
      return {
        gap:
          inner.x -
          outer.x -
          parseFloat(getComputedStyle(node).borderLeftWidth),
        radius: parseFloat(getComputedStyle(body).borderTopLeftRadius),
      };
    });
    expect(geometry.gap).toBe(2);
    expect(geometry.radius).toBeGreaterThan(0);
  });
}

test("the same Card fills a sized parent with compact padding and a scrolling body", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=components-card--filled&viewMode=story");
  const card = page.locator("section.floating-card");
  await expect(card).toBeVisible();
  expect((await card.boundingBox())!.height).toBe(280);
  await expect(card.locator(".card-body")).toHaveCSS("padding", "4px");
  const header = card.locator(".card-heading"),
    footer = card.locator(".card-footer");
  const before = [await header.boundingBox(), await footer.boundingBox()];
  const viewport = card.locator('[data-scroll-area="viewport"]');
  expect(
    await viewport.evaluate((node) => node.scrollHeight > node.clientHeight),
  ).toBe(true);
  await viewport.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  expect([await header.boundingBox(), await footer.boundingBox()]).toEqual(
    before,
  );
});
