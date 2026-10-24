import { expect, test, type Locator, type Page } from "@playwright/test";

const viewport = (page: Page) => page.locator("[data-sliding-pages]");
const panel = (page: Page, value: string) =>
  page.locator(`[data-sliding-page="${value}"]`);
async function open(page: Page, story: string) {
  await page.goto(
    `/iframe.html?id=components-slidingpages--${story}&viewMode=story`,
  );
  await expect(viewport(page)).toBeVisible();
}
const bounds = (node: Locator) =>
  node.evaluate((element) => {
    const { width, height, x, y } = element.getBoundingClientRect();
    return { width, height, x, y };
  });
async function settled(root: Locator) {
  await expect
    .poll(() =>
      root.evaluate((element) => {
        const target = parseFloat(
          getComputedStyle(element).getPropertyValue("--sliding-pages-height"),
        );
        return Math.abs(element.getBoundingClientRect().height - target);
      }),
    )
    .toBeLessThan(1);
}
async function slow(root: Locator) {
  await root.evaluate((element) =>
    (element as HTMLElement).style.setProperty(
      "--ui-sliding-pages-duration",
      "1000ms",
    ),
  );
}
const offset = (node: Locator, vertical = false) =>
  node.evaluate((element, vertical) => {
    const transform = new DOMMatrixReadOnly(
      getComputedStyle(element).transform,
    );
    return vertical ? transform.m42 : transform.m41;
  }, vertical);

test("fixed viewport slides both pages without resizing, preserves drafts and keeps external navigation focused", async ({
  page,
}) => {
  await open(page, "fixed-viewport");
  const root = viewport(page);
  const before = await bounds(root);
  await page.getByLabel("Display name").fill("A persistent draft");
  await slow(root);
  const next = page.getByRole("button", { name: "Next", exact: true });
  await next.click();
  await expect(next).toBeFocused();
  await expect.poll(() => offset(panel(page, "profile"))).toBeLessThan(-1);
  const leaving = await offset(panel(page, "profile"));
  const entering = await offset(panel(page, "workspace"));
  expect(leaving).toBeGreaterThan(-before.width);
  expect(entering).toBeGreaterThan(0);
  expect(entering).toBeLessThan(before.width);
  expect(await bounds(root)).toEqual(before);
  await expect(panel(page, "profile")).toHaveAttribute("inert", "");
  await expect(panel(page, "profile")).toHaveAttribute("aria-hidden", "true");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel("Display name")).toHaveValue(
    "A persistent draft",
  );
  await expect(page.locator("[data-sliding-page]")).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("auto height interpolates between measured sizes and follows changes inside the active page", async ({
  page,
}) => {
  await open(page, "auto-height");
  const root = viewport(page);
  await settled(root);
  const before = await bounds(root);
  await slow(root);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect
    .poll(async () => (await bounds(root)).height)
    .toBeGreaterThan(before.height + 1);
  const middle = await bounds(root);
  const target = (await bounds(panel(page, "workspace"))).height + 2;
  expect(middle.height).toBeLessThan(target - 1);
  expect(middle.width).toBe(before.width);
  expect(middle.x).toBe(before.x);
  expect(middle.y).toBe(before.y);
  await settled(root);
  const compact = (await bounds(root)).height;
  await page.getByRole("button", { name: "Toggle extra details" }).click();
  await expect
    .poll(async () => (await bounds(root)).height)
    .toBeGreaterThan(compact + 1);
  await settled(root);
  await root.screenshot({ path: "/tmp/nox-sliding-pages-height.png" });
  await page.getByRole("button", { name: "Toggle extra details" }).click();
  await settled(root);
  expect(Math.abs((await bounds(root)).height - compact)).toBeLessThan(1);
});

test("auto size animates both axes, retargets rapid jumps and constrains pages after parent resize", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page, "auto-size");
  const root = viewport(page);
  await settled(root);
  const before = await bounds(root);
  await slow(root);
  await page.getByRole("button", { name: "2. workspace", exact: true }).click();
  await expect
    .poll(async () => (await bounds(root)).width)
    .toBeGreaterThan(before.width + 1);
  expect((await bounds(root)).width).toBeLessThan(462);
  await page
    .getByRole("button", { name: "3. review", exact: true })
    .dispatchEvent("click");
  await page
    .getByRole("button", { name: "1. profile", exact: true })
    .dispatchEvent("click");
  await settled(root);
  await expect
    .poll(async () => (await bounds(root)).width)
    .toBeCloseTo(before.width, 0);
  await page.getByRole("button", { name: "2. workspace", exact: true }).click();
  await settled(root);
  await expect.poll(async () => (await bounds(root)).width).toBeCloseTo(462, 0);
  await root.screenshot({ path: "/tmp/nox-sliding-pages-both.png" });
  await page.setViewportSize({ width: 340, height: 720 });
  await settled(root);
  await expect
    .poll(async () => (await bounds(root)).width)
    .toBeLessThanOrEqual(292);
  expect((await bounds(panel(page, "workspace"))).width).toBeLessThanOrEqual(
    290,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("form steps validate locally, transfer internal focus and submit fields from all mounted pages", async ({
  page,
}) => {
  await open(page, "multi-step-form");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByLabel("Name", { exact: true })).toBeFocused();
  await expect(viewport(page)).toHaveAttribute("data-value", "profile");
  await page.getByLabel("Name", { exact: true }).fill("Ada");
  await page.getByLabel("Email", { exact: true }).fill("ada@example.com");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Workspace", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("textbox", { name: "Workspace", exact: true })
    .fill("Research");
  await page.getByLabel("Notes").fill("Keep all drafts.");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(panel(page, "profile")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Name", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Ada");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Workspace", exact: true }),
  ).toHaveValue("Research");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(panel(page, "review")).toBeFocused();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page.getByLabel("Submitted form")).toHaveText(
    '{"name":"Ada","email":"ada@example.com","workspace":"Research","notes":"Keep all drafts."}',
  );
});

for (const [story, vertical] of [
  ["vertical", true],
  ["right-to-left", false],
] as const) {
  test(`${story} uses the matching slide direction`, async ({ page }) => {
    await open(page, story);
    await slow(viewport(page));
    await page.getByRole("button", { name: "Next", exact: true }).click();
    if (vertical) {
      await expect
        .poll(() => offset(panel(page, "profile"), true))
        .toBeLessThan(-1);
      expect(await offset(panel(page, "workspace"), true)).toBeGreaterThan(0);
      expect(await offset(panel(page, "workspace"))).toBe(0);
    } else {
      await expect
        .poll(() => offset(panel(page, "profile")))
        .toBeGreaterThan(1);
      expect(await offset(panel(page, "workspace"))).toBeLessThan(0);
    }
  });
}

test("reduced motion switches pages and dimensions without active transitions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "auto-size");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(viewport(page)).toHaveAttribute("data-value", "workspace");
  await settled(viewport(page));
  expect(await offset(panel(page, "workspace"))).toBe(0);
  await expect(panel(page, "profile")).toBeHidden();
  expect(
    await viewport(page).evaluate(
      (element) =>
        element
          .getAnimations({ subtree: true })
          .filter((animation) => animation instanceof CSSTransition).length,
    ),
  ).toBe(0);
});

test("StrictMode retains live resizing and state across repeated navigation without observer errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page, "strict-lifecycle");
  await page.getByLabel("Display name").fill("Strict draft");
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole("button", { name: "2. workspace", exact: true })
      .dispatchEvent("click");
    await page
      .getByRole("button", { name: "1. profile", exact: true })
      .dispatchEvent("click");
  }
  await settled(viewport(page));
  await expect(page.getByLabel("Display name")).toHaveValue("Strict draft");
  await page.getByRole("button", { name: "2. workspace", exact: true }).click();
  await settled(viewport(page));
  const height = (await bounds(viewport(page))).height;
  await page.getByRole("button", { name: "Toggle extra details" }).click();
  await expect
    .poll(async () => (await bounds(viewport(page))).height)
    .toBeGreaterThan(height);
  await settled(viewport(page));
  expect(errors).toEqual([]);
});
