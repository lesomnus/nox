import { expect, test, type Page } from "@playwright/test";

test.use({
  launchOptions: {
    args: [
      "--no-zygote",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--renderer-process-limit=1",
    ],
  },
});
async function open(page: Page) {
  const start = new Date("2026-01-01T00:00:00Z");
  await page.clock.install({ time: start });
  await page.clock.pauseAt(new Date(start.getTime() + 60_000));
  await page.goto(
    "/iframe.html?id=components-button--link-interaction&viewMode=story",
  );
}

test("anchor ink holds and releases without changing layout, callbacks or native navigation", async ({
  page,
}) => {
  await open(page);
  const link = page.getByRole("link", { name: "Open project", exact: true });
  const ink = link.locator("canvas[data-ink-sparkle]");
  await expect(link).toHaveAttribute("data-effect", "sparkle");
  const box = await link.boundingBox();
  await link.hover();
  await page.mouse.down();
  await expect(ink).toHaveAttribute("data-renderer", "webgl2");
  await expect(ink).toHaveAttribute("data-pressed", "true");
  expect(await link.boundingBox()).toEqual(box);
  await expect(ink).toHaveCSS("pointer-events", "none");
  await expect(page.getByRole("status")).toHaveText(
    "Clicks: 0; pointer downs: 1; keys: 0",
  );
  await page.clock.runFor(600);
  await page.mouse.up();
  await expect(page).toHaveURL(/#destination$/);
  await expect(page.getByRole("status")).toHaveText(
    "Clicks: 1; pointer downs: 1; keys: 0",
  );
  await expect(ink).toHaveAttribute("data-pressed", "false");
  await page.clock.runFor(1300);
  await expect(ink).toHaveCount(0);
  await page.getByRole("button", { name: "Focus link" }).click();
  await expect(link).toBeFocused();
  // Space is not an activation key for native anchors.
  await page.keyboard.press("Space");
  await expect(ink).toHaveCount(0);
  await page.keyboard.down("Enter");
  await expect(ink).toHaveCount(1);
  await expect(page.getByRole("status")).toHaveText(
    "Clicks: 2; pointer downs: 1; keys: 2",
  );
  await page.keyboard.up("Enter");
  await page.clock.runFor(1300);
  await expect(ink).toHaveCount(0);
});

test("panel anchors share ink; opt-out, prevented and disabled links allocate none", async ({
  page,
}) => {
  await open(page);
  const panel = page.getByRole("link", { name: "Panel link", exact: true });
  await panel.hover();
  await page.mouse.down();
  await expect(panel.locator("canvas[data-ink-sparkle]")).toHaveAttribute(
    "data-renderer",
    "webgl2",
  );
  // Releasing outside cancels the native click and still clears the effect.
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await page.clock.runFor(1300);
  await expect(page.locator("canvas[data-ink-sparkle]")).toHaveCount(0);
  for (const name of ["Disabled link", "Link without ink", "Prevented press"]) {
    const link = page.getByRole("link", { name, exact: true });
    await link.dispatchEvent("pointerdown", {
      button: 0,
      isPrimary: true,
      pointerId: 1,
    });
    await link.dispatchEvent("keydown", { key: "Enter" });
    await expect(link.locator("canvas")).toHaveCount(0);
  }
  const url = page.url();
  await page
    .getByRole("link", { name: "Disabled link" })
    .evaluate((el: HTMLAnchorElement) => el.click());
  expect(page.url()).toBe(url);
});
