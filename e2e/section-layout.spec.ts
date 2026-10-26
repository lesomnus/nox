import { expect, test } from "@playwright/test";

for (const width of [1280, 320])
  test(`grouped sections remain bounded and centered at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      "/iframe.html?id=layout-sectionlayout--default&viewMode=story",
    );
    const layout = page.locator('[data-section-layout="layout"]');
    const group = page
      .getByRole("article", { name: "Workspace", exact: true })
      .locator('[data-section-layout="group"]');
    await expect(
      group.getByRole("region", { name: "Workspace information" }),
    ).toBeVisible();
    const geometry = await group.evaluate((node) => {
      const parent = node.closest('[data-section-layout="layout"]')!,
        box = parent.getBoundingClientRect();
      const css = getComputedStyle(parent),
        groupCSS = getComputedStyle(node);
      return {
        x: box.x,
        width: box.width,
        max: parseFloat(css.getPropertyValue("--ui-section-layout-max-width")),
        outerGap: parseFloat(css.gap),
        innerGap: parseFloat(groupCSS.gap),
        outer: css.getPropertyValue("--ui-section-radius").trim(),
        inner: css.getPropertyValue("--ui-section-inner-radius").trim(),
        corners: Array.from(node.children).map((child) => {
          const s = getComputedStyle(child);
          return [
            s.borderTopLeftRadius,
            s.borderTopRightRadius,
            s.borderBottomRightRadius,
            s.borderBottomLeftRadius,
          ];
        }),
      };
    });
    expect(geometry.width).toBeLessThanOrEqual(geometry.max);
    expect(geometry.x + geometry.width / 2).toBeCloseTo(width / 2, 1);
    expect(geometry.outerGap).toBeGreaterThan(geometry.innerGap);
    expect(geometry.innerGap).toBeGreaterThan(0);
    expect(geometry.corners).toEqual([
      [geometry.outer, geometry.outer, geometry.inner, geometry.inner],
      [geometry.inner, geometry.inner, geometry.inner, geometry.inner],
      [geometry.inner, geometry.inner, geometry.outer, geometry.outer],
    ]);
    await expect(
      group.locator('[data-section-layout="section"]').first(),
    ).toHaveCSS("border-top-width", "0px");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(layout).toBeVisible();
  });

test("standalone sections retain complete rounded surfaces", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-sectionlayout--standalone&viewMode=story",
  );
  const sections = page.locator('[data-section-layout="section"]');
  await expect(sections).toHaveCount(2);
  for (const section of await sections.all()) {
    const corners = await section.evaluate((node) => {
      const s = getComputedStyle(node);
      return [
        s.borderTopLeftRadius,
        s.borderTopRightRadius,
        s.borderBottomRightRadius,
        s.borderBottomLeftRadius,
      ];
    });
    expect(new Set(corners).size).toBe(1);
    expect(parseFloat(corners[0])).toBeGreaterThan(0);
  }
});

test("conditional sections update the outer silhouette without changing the remaining surface", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-sectionlayout--dynamic-sections&viewMode=story",
  );
  const first = page.getByRole("region", { name: "Information", exact: true });
  const before = (await first.boundingBox())!;
  const radius = await first.evaluate(
    (n) => getComputedStyle(n).borderTopLeftRadius,
  );
  await page.getByRole("button", { name: "Remove last section" }).click();
  await expect(
    page.getByRole("region", { name: "Optional activity" }),
  ).toHaveCount(0);
  await expect(first).toHaveCSS("border-bottom-left-radius", radius);
  expect(await first.boundingBox()).toEqual(before);
  await page.getByRole("button", { name: "Add last section" }).click();
  await expect(
    page.getByRole("region", { name: "Optional activity" }),
  ).toBeVisible();
  expect(
    await first.evaluate((n) => getComputedStyle(n).borderBottomLeftRadius),
  ).not.toBe(radius);
});

test("column alignment and maximum width can be configured independently", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-sectionlayout--start-aligned&viewMode=story",
  );
  const layout = page.locator('[data-section-layout="layout"]');
  const geometry = () =>
    layout.evaluate((node) => {
      const p = node.parentElement!,
        r = node.getBoundingClientRect(),
        b = p.getBoundingClientRect(),
        s = getComputedStyle(p);
      return {
        left: r.left,
        parentLeft: b.left + parseFloat(s.paddingLeft),
        width: r.width,
        available:
          b.width - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight),
      };
    });
  const start = await geometry();
  expect(start.left).toBeCloseTo(start.parentLeft, 1);
  expect(start.width).toBeLessThan(start.available);
  await page.goto(
    "/iframe.html?id=layout-sectionlayout--full-width&viewMode=story",
  );
  const full = await geometry();
  expect(full.width).toBeCloseTo(full.available, 1);
});
