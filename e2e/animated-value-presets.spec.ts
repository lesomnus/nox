import { expect, test, type Locator, type Page } from "@playwright/test";

async function freeze(page: Page) {
  await page.clock.install();
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(new Date(now + 50));
}
async function click(page: Page, name: string) {
  await page
    .getByRole("button", { name, exact: true })
    .evaluate((node: HTMLButtonElement) => node.click());
}
async function delays(value: Locator) {
  return value
    .locator("[data-changing]")
    .evaluateAll((cells) =>
      cells.map((cell) =>
        parseFloat(
          getComputedStyle(cell).getPropertyValue("--animated-text-delay"),
        ),
      ),
    );
}

test("the public preset handles loading, cache hits and fresh updates without an app wrapper", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-animatedcompactnumber--loading-and-refresh&viewMode=story",
  );
  const value = page.getByRole("img", { name: "Value", exact: true });
  await expect(value).toHaveText("----·");
  await freeze(page);
  await click(page, "Load value");
  await expect(value.locator('[data-slide-steps="4"]').first()).toBeAttached();
  await expect(value.locator("[data-color-reveal]").first()).toBeAttached();
  // The preset includes the element's viewport position in its initial delay.
  await page.clock.runFor(2000);
  await expect(value).toHaveText("9.99M");
  await click(page, "Use cached value");
  await expect(value).toHaveText("12.3K");
  await expect(value.locator("[data-changing]")).toHaveCount(0);
  await click(page, "Refresh value");
  // A fresh response starts at the cached value, rather than a new dash baseline.
  await expect(
    value.locator("[data-changing]").first().locator('[data-slide-frame="0"]'),
  ).toHaveText("1");
  await page.clock.runFor(2000);
  await expect(value).toHaveText("6.54M");
});

test("the preset honors duration and step configuration with spatial/random delays disabled", async ({
  page,
}) => {
  await freeze(page);
  await page.goto(
    "/iframe.html?id=components-animatedcompactnumber--configured&viewMode=story",
  );
  const value = page.getByRole("img", { name: "Value", exact: true });
  const strip = value
    .locator('[data-slide-steps="3"] [data-slide-strip]')
    .first();
  await expect(strip).toBeAttached();
  expect(
    await strip.evaluate(
      (node) => node.getAnimations()[0].effect!.getTiming().duration,
    ),
  ).toBe(1200);
  expect((await delays(value)).every((delay) => delay === 0)).toBe(true);
  await page.clock.runFor(1201);
  await expect(value).toHaveText("6.54M");
});

test("the public preset owns spatial staggering and clipped scroll updates never replay", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-animatedcompactnumber--scrollable-grid&viewMode=story",
  );
  const first = page.getByRole("img", { name: "Metric 1", exact: true });
  const second = page.getByRole("img", { name: "Metric 2", exact: true });
  const last = page.getByRole("img", { name: "Metric 18", exact: true });
  await expect(last).toHaveText("----·");
  await freeze(page);
  await click(page, "Load grid");
  await expect(first.locator("[data-changing]").first()).toBeAttached();
  await expect(last).toHaveText("6.75M");
  await expect(last.locator("[data-changing]")).toHaveCount(0);
  const start = await delays(first);
  expect(Math.min(...start)).toBeLessThan(Math.min(...(await delays(second))));
  expect(Math.max(...start) - Math.min(...start)).toBeLessThanOrEqual(90);
  await page.locator('[data-scroll-area="viewport"]').evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await page.clock.runFor(32);
  await expect(last).toBeInViewport();
  await expect(last.locator("[data-changing]")).toHaveCount(0);
  await expect(first.locator("[data-changing]")).toHaveCount(0);
});

test("cached and reduced-motion presets show final values immediately", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-animatedcompactnumber--cached&viewMode=story",
  );
  await expect(
    page.getByRole("img", { name: "Value", exact: true }),
  ).toHaveText("6.54M");
  await expect(page.locator("[data-changing]")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    "/iframe.html?id=components-animatedcompactnumber--default&viewMode=story",
  );
  await expect(
    page.getByRole("img", { name: "Value", exact: true }),
  ).toHaveText("6.54M");
  await expect(page.locator("[data-changing]")).toHaveCount(0);
  await page.goto(
    "/iframe.html?id=components-animateddurationdisplay--unknown&viewMode=story",
  );
  await expect(
    page.getByRole("img", { name: "Duration unavailable", exact: true }),
  ).toHaveText("--d--h--m");
  await page.goto(
    "/iframe.html?id=components-animateddurationdisplay--cached&viewMode=story",
  );
  await expect(page.getByRole("img").first()).toHaveText("06d23h59m");
  await expect(page.locator("[data-changing]")).toHaveCount(0);
});
