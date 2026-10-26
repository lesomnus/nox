import { expect, test } from "@playwright/test";

for (const offset of [0, -16, 7.5]) {
  test(`signed offset ${offset} aligns both handle centers to the container edges`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=layout-scrollarea--outside-both-axes&viewMode=story&args=scrollbarOffset:${offset}`,
    );
    const area = page.locator('[data-scroll-area="root"]');
    await expect(area).toHaveAttribute("data-scrollbar-offset", String(offset));
    await expect(area.getByRole("scrollbar")).toHaveCount(2);
    const root = (await area.boundingBox())!;
    const vertical = (await area
      .locator('[data-scroll-area="handle"]')
      .boundingBox())!;
    const horizontal = (await area
      .locator('[data-scroll-area="horizontal-handle"]')
      .boundingBox())!;
    expect(vertical.x + vertical.width / 2 - root.x - root.width).toBeCloseTo(
      offset,
      1,
    );
    expect(
      horizontal.y + horizontal.height / 2 - root.y - root.height,
    ).toBeCloseTo(offset, 1);
    const gap = await area.evaluate((node) =>
      parseFloat(getComputedStyle(node).getPropertyValue("--ui-control-inset")),
    );
    const viewport = (await area
      .locator('[data-scroll-area="viewport"]')
      .boundingBox())!;
    expect(root.height - viewport.height).toBeCloseTo(
      Math.max(0, horizontal.height / 2 + gap - offset),
      1,
    );
  });
}

test("outside handles keep a full rounded viewport and remain draggable beyond its edge", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=layout-scrollarea--outside&viewMode=story");
  const area = page.locator('[data-scroll-area="root"]');
  const viewport = area.locator('[data-scroll-area="viewport"]');
  const handle = area.locator('[data-scroll-area="handle"]');
  const thumb = area.getByRole("scrollbar", { name: "Scroll entries" });
  await expect(thumb).toBeVisible();
  await area.hover();
  const frame = (await area.boundingBox())!;
  expect((await viewport.boundingBox())!.height).toBe(frame.height);
  expect((await viewport.boundingBox())!.width).toBe(frame.width);
  await expect(viewport).toHaveCSS("border-radius", "12px");
  await expect(area.locator('[data-scroll-area="content"]')).toHaveCSS(
    "padding-right",
    "0px",
  );
  const bar = (await handle.boundingBox())!;
  expect(bar.x).toBeGreaterThan(frame.x + frame.width);
  await page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2);
  await expect(area).toHaveAttribute("data-near", "true");
  await expect(handle).toHaveCSS("opacity", "1");
  const expanded = (await handle.boundingBox())!;
  expect(expanded.x).toBeGreaterThanOrEqual(frame.x + frame.width);
  expect(
    await thumb.evaluate((node) => {
      const handle = node.querySelector<HTMLElement>(
        '[data-scroll-area="handle"]',
      )!;
      const rect = handle.getBoundingClientRect();
      return node.contains(
        document.elementFromPoint(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
        ),
      );
    }),
  ).toBe(true);
  const rail = (await area.locator('[data-scroll-area="rail"]').boundingBox())!;
  await page.mouse.down();
  await page.mouse.move(expanded.x + expanded.width / 2, rail.y + rail.height);
  await page.mouse.up();
  await expect
    .poll(() =>
      viewport.evaluate(
        (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
      ),
    )
    .toBeLessThan(1);
  await thumb.press("Home");
  await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBe(0);
  await thumb.press("End");
  await expect
    .poll(() =>
      viewport.evaluate(
        (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
      ),
    )
    .toBeLessThan(1);
  await page.goto(
    "/iframe.html?id=layout-scrollarea--outside-no-overflow&viewMode=story",
  );
  await expect(page.getByRole("scrollbar")).toHaveCount(0);
});

test("both outside axes preserve the viewport height and horizontal controls track resizing", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-scrollarea--outside-both-axes&viewMode=story",
  );
  const area = page.locator('[data-scroll-area="root"]');
  const viewport = area.locator('[data-scroll-area="viewport"]');
  const horizontal = area.getByRole("scrollbar", { name: "Scroll columns" });
  const vertical = area.getByRole("scrollbar", { name: "Scroll entries" });
  await expect(horizontal).toBeVisible();
  await expect(vertical).toBeVisible();
  const frame = (await area.boundingBox())!;
  expect((await viewport.boundingBox())!.height).toBe(frame.height);
  const handle = (await area
    .locator('[data-scroll-area="horizontal-handle"]')
    .boundingBox())!;
  expect(handle.y).toBeGreaterThan(frame.y + frame.height);
  await horizontal.press("ArrowRight");
  await expect
    .poll(() => viewport.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(0);
  await horizontal.press("Home");
  const rail = (await area
    .locator('[data-scroll-area="horizontal-rail"]')
    .boundingBox())!;
  const thumb = (await horizontal.boundingBox())!;
  await page.mouse.move(
    thumb.x + thumb.width / 2,
    handle.y + handle.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(rail.x + rail.width, handle.y + handle.height / 2);
  await page.mouse.up();
  await expect
    .poll(() =>
      viewport.evaluate(
        (el) => el.scrollWidth - el.clientWidth - el.scrollLeft,
      ),
    )
    .toBeLessThan(1);
  await page.getByRole("button", { name: "Fit content" }).click();
  await expect(horizontal).toHaveCount(0);
  expect((await viewport.boundingBox())!.height).toBe(frame.height);
  await expect(vertical).toBeVisible();
});

test("horizontal scrollbar follows content resizing and releases its reserved space", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-scrollarea--horizontal-overflow&viewMode=story",
  );
  const viewport = page.locator('[data-scroll-area="viewport"]');
  const bar = page.getByRole("scrollbar", { name: "Scroll columns" });
  await expect(bar).toBeVisible();
  await bar.focus();
  await bar.press("ArrowRight");
  await expect
    .poll(() => viewport.evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Fit content" }).click();
  await expect(bar).toHaveCount(0);
  await expect(viewport).toHaveCSS("height", "160px");
  await page.getByRole("button", { name: "Widen content" }).click();
  await expect(bar).toBeVisible();
});

test("standalone scroll area supplies its own style, centered rail, hover, drag and keyboard scrolling", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-scrollarea--short-overflow&viewMode=story",
  );
  const area = page.locator('[data-scroll-area="root"]'),
    viewport = area.locator('[data-scroll-area="viewport"]');
  const rail = area.locator('[data-scroll-area="rail"]'),
    handle = area.locator('[data-scroll-area="handle"]');
  const thumb = area.getByRole("scrollbar", { name: "Scroll entries" });
  await expect(thumb).toBeVisible();
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--space"),
    ),
  ).toBe("");
  const rootBox = (await area.boundingBox())!,
    railBox = (await rail.boundingBox())!,
    thumbBox = (await thumb.boundingBox())!;
  expect(railBox.height).toBeLessThan(rootBox.height);
  expect(railBox.y + railBox.height / 2).toBeCloseTo(
    rootBox.y + rootBox.height / 2,
    0,
  );
  expect(thumbBox.height).toBeLessThan(railBox.height / 2);
  await page.mouse.move(0, 0);
  await expect(handle).toHaveCSS("opacity", "0");
  await area.hover();
  await expect(handle).toHaveCSS("opacity", "0.7");
  await expect
    .poll(() => rail.evaluate((el) => getComputedStyle(el, "::before").opacity))
    .toBe("1");
  await page.mouse.move(
    thumbBox.x + thumbBox.width / 2,
    thumbBox.y + thumbBox.height / 2,
  );
  await expect(handle).toHaveCSS("opacity", "1");
  await page.mouse.down();
  await page.mouse.move(
    thumbBox.x + thumbBox.width / 2,
    railBox.y + railBox.height,
  );
  await page.mouse.up();
  await expect
    .poll(() =>
      viewport.evaluate(
        (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
      ),
    )
    .toBeLessThan(1);
  await thumb.focus();
  await thumb.press("Home");
  await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBe(0);
  await thumb.press("End");
  await expect
    .poll(() =>
      viewport.evaluate(
        (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
      ),
    )
    .toBeLessThan(1);
  await page.goto(
    "/iframe.html?id=layout-scrollarea--no-overflow&viewMode=story",
  );
  await expect(page.getByRole("scrollbar")).toHaveCount(0);
});

test("standalone content growth keeps the rail centered and viewportRef/onScroll work without app services", async ({
  page,
}) => {
  const api: string[] = [];
  page.on("request", (request) => {
    if (/\/cxz\./.test(request.url())) api.push(request.url());
  });
  await page.goto(
    "/iframe.html?id=layout-scrollarea--growing-content&viewMode=story",
  );
  const area = page.locator('[data-scroll-area="root"]'),
    viewport = area.locator('[data-scroll-area="viewport"]'),
    rail = area.locator('[data-scroll-area="rail"]');
  const handle = area.locator('[data-scroll-area="handle"]');
  await expect(area.getByRole("scrollbar")).toBeVisible();
  const initial = (await rail.boundingBox())!.height;
  const add = page.getByRole("button", { name: "Add entries" });
  await add.hover();
  await expect(handle).toHaveCSS("opacity", "0");
  await add.click();
  await expect
    .poll(async () => (await rail.boundingBox())!.height)
    .toBeGreaterThan(initial);
  const outer = (await area.boundingBox())!,
    grown = (await rail.boundingBox())!;
  expect(grown.y + grown.height / 2).toBeCloseTo(outer.y + outer.height / 2, 0);
  await page.getByRole("button", { name: "Scroll to bottom" }).click();
  await expect
    .poll(() =>
      viewport.evaluate(
        (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
      ),
    )
    .toBeLessThan(1);
  await expect
    .poll(() => page.getByLabel("Scroll position").textContent())
    .not.toBe("0");
  expect(api).toEqual([]);
});
