import { expect, test, type Page } from "@playwright/test";

const root = (page: Page) => page.locator("[data-card-stack]");
async function open(page: Page, story: string) {
  await page.goto(
    `/iframe.html?id=components-cardstack--${story}&viewMode=story`,
  );
  await page
    .getByRole("group", { name: "Queue controls", exact: true })
    .waitFor();
}

test("generic queue preserves keyed backs, advances FIFO and dismisses without consuming items", async ({
  page,
}) => {
  await open(page, "queue");
  await expect(root(page)).toHaveCount(0);
  const controls = page.getByRole("group", {
    name: "Queue controls",
    exact: true,
  });
  await controls.hover();
  await expect(
    page.getByRole("region", { name: "Queued card 1", exact: true }),
  ).toBeVisible();
  const back = root(page).locator("[data-card-stack-back='2']");
  await expect(back).toHaveAttribute("data-demo-id", "3");
  const previous = await back.elementHandle();
  await page.getByRole("button", { name: "Process next", exact: true }).click();
  await expect(root(page)).toHaveAttribute("data-pending-count", "4");
  await expect(
    page.getByRole("region", { name: "Queued card 2", exact: true }),
  ).toBeVisible();
  const retained = root(page).locator("[data-card-stack-back='1']");
  await expect(retained).toHaveAttribute("data-demo-id", "3");
  expect(
    await retained.evaluate((node, before) => node === before, previous),
  ).toBe(true);
  await expect(retained.locator(":scope > div")).toHaveAttribute(
    "data-back-motion",
    "advance",
  );
  await expect(
    root(page).locator("[data-card-stack-back='2']"),
  ).toHaveAttribute("data-demo-id", "4");
  await page.mouse.move(8, 120);
  await expect(root(page)).toHaveCount(0);
  await expect(
    page.getByRole("img", { name: "4 queued cards", exact: true }),
  ).toBeVisible();
});

test("visibleCount supports a larger bounded window and refills the deepest slot", async ({
  page,
}) => {
  await open(page, "more-visible-cards");
  await expect(root(page).locator("[data-card-stack-back]")).toHaveCount(4);
  await page.getByRole("button", { name: "Process next", exact: true }).click();
  await expect(
    root(page).locator("[data-card-stack-back='4']"),
  ).toHaveAttribute("data-demo-id", "6");
  const bounds = await root(page).boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  const retained = root(page).locator(
    "[data-demo-id='5'][data-card-stack-back]",
  );
  const previous = await retained.elementHandle();
  await expect
    .poll(() =>
      retained
        .locator(":scope > div")
        .evaluate((node) =>
          node
            .getAnimations()
            .every((animation) => animation.playState === "finished"),
        ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Process next", exact: true }).click();
  await expect(retained).toHaveAttribute("data-card-stack-back", "2");
  expect(
    await retained.evaluate((node, before) => node === before, previous),
  ).toBe(true);
  expect(
    await retained
      .locator(":scope > div")
      .evaluate((node) =>
        node
          .getAnimations()
          .some((animation) => animation.playState === "running"),
      ),
  ).toBe(true);
  await expect(
    root(page).locator("[data-card-stack-back='4']"),
  ).toHaveAttribute("data-demo-id", "7");
  await page.getByRole("button", { name: "Clear queue", exact: true }).click();
  await expect(root(page)).toHaveCount(0);
});

test("long bodies scroll inside their bounded viewport", async ({ page }) => {
  await open(page, "long-content");
  const front = page.getByRole("region", {
    name: "Queued card 1",
    exact: true,
  });
  await expect(front).toBeVisible();
  expect((await front.boundingBox())!.height).toBeLessThanOrEqual(360);
  await front.hover();
  await expect(
    front.getByRole("scrollbar", { name: "Queued card content", exact: true }),
  ).toBeVisible();
  await front.locator("pre").evaluate((node) => {
    let viewport = node.parentElement;
    while (viewport && getComputedStyle(viewport).overflowY !== "auto")
      viewport = viewport.parentElement;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  });
  await expect(front).toContainText("line 80");
});

test("body portal and narrow viewport require no host-specific layout or API", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await open(page, "body-portal");
  await expect(root(page)).toBeVisible();
  expect(
    await root(page).evaluate((node) => node.parentElement === document.body),
  ).toBe(true);
  const bounds = (await root(page).boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  expect(
    await root(page).evaluate((node) => getComputedStyle(node).position),
  ).toBe("fixed");
  const typography = await root(page).evaluate((node) => {
    const root = getComputedStyle(node);
    const anchor = getComputedStyle(
      document.querySelector("[aria-label='Queue controls']")!,
    );
    return {
      color: root.color,
      font: root.fontFamily,
      anchorColor: anchor.color,
      anchorFont: anchor.fontFamily,
    };
  });
  expect(typography.color).toBe(typography.anchorColor);
  expect(typography.font).toBe(typography.anchorFont);
});

test("primitive zero is a valid item and can depart", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=components-cardstack--primitive-items&viewMode=story",
  );
  await expect(
    page.getByRole("region", { name: "Number 0", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next number", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Number 1", exact: true }),
  ).toBeVisible();
  await expect(root(page).locator("[data-card-stack-exiting]")).toHaveCount(0);
});

test("reduced motion also covers advancement and replacement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "more-visible-cards");
  await page.getByRole("button", { name: "Process next", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Queued card 2", exact: true }),
  ).toBeVisible();
  expect(
    await root(page).evaluate(
      (node) =>
        [
          ...node.querySelectorAll(
            "[data-motion], [data-card-stack-back] > div",
          ),
        ].flatMap((n) => n.getAnimations()).length,
    ),
  ).toBe(0);
  await page.getByRole("button", { name: "Clear queue", exact: true }).click();
  await expect(root(page)).toHaveCount(0);
});
