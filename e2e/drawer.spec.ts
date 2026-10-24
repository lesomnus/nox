import { expect, test, type Page } from "@playwright/test";

async function open(
  page: Page,
  name = "default",
  reducedMotion: "reduce" | "no-preference" = "reduce",
) {
  await page.emulateMedia({ reducedMotion });
  await page.goto(`/iframe.html?id=components-drawer--${name}&viewMode=story`);
  const launch = page.getByRole("button", { name: "Open drawer", exact: true });
  await launch.click();
  const drawer = page.getByRole("dialog", {
    name: "Task details",
    exact: true,
  });
  await expect(drawer).toBeVisible();
  return { drawer, launch, frame: drawer.locator('[data-drawer="frame"]') };
}

for (const [name, side, width, height] of [
  ["default", "right", 420, undefined],
  ["left", "left", 340, 300],
  ["top", "top", 520, 260],
  ["bottom", "bottom", 520, 260],
] as const) {
  test(`${side} uses the selected wall and independent dimensions`, async ({
    page,
  }) => {
    const { drawer, frame } = await open(page, name);
    await expect(drawer).toHaveAttribute("data-side", side);
    await expect(drawer).toHaveCSS("font-family", "system-ui, sans-serif");
    const bounds = (await frame.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(bounds.width).toBeCloseTo(width, 1);
    expect(bounds.height).toBeCloseTo(height ?? viewport.height - 16, 1);
    if (side === "right")
      expect(bounds.x + bounds.width).toBeCloseTo(viewport.width - 8, 1);
    if (side === "left") expect(bounds.x).toBeCloseTo(8, 1);
    if (side === "top") expect(bounds.y).toBeCloseTo(8, 1);
    if (side === "bottom")
      expect(bounds.y + bounds.height).toBeCloseTo(viewport.height - 8, 1);
    const radius = await drawer
      .locator(".floating-card")
      .evaluate((node) => getComputedStyle(node).borderTopLeftRadius);
    expect(parseFloat(radius)).toBeGreaterThan(0);
  });
}

test("custom dimensions, end alignment and mobile clamping do not force full size", async ({
  page,
}) => {
  const { frame } = await open(page, "custom-size");
  let bounds = (await frame.boundingBox())!;
  let viewport = page.viewportSize()!;
  expect(bounds.width).toBe(320);
  expect(bounds.height).toBe(280);
  expect(bounds.x + bounds.width).toBe(viewport.width - 12);
  expect(bounds.y + bounds.height).toBe(viewport.height - 12);
  await page.setViewportSize({ width: 300, height: 240 });
  viewport = page.viewportSize()!;
  await expect
    .poll(async () => (await frame.boundingBox())!.width)
    .toBe(viewport.width - 24);
  bounds = (await frame.boundingBox())!;
  expect(bounds.height).toBe(viewport.height - 24);
});

test("contained overlay tracks the container's size and position", async ({
  page,
}) => {
  const { drawer, frame } = await open(page, "contained");
  const container = page.locator('[data-drawer-example="container"]');
  const original = (await container.boundingBox())!;
  expect(await drawer.boundingBox()).toEqual(original);
  await container.evaluate((node) => {
    node.style.width = "500px";
    node.style.height = "300px";
    node.style.marginLeft = "20px";
  });
  await expect.poll(async () => (await drawer.boundingBox())!.width).toBe(500);
  const resized = (await container.boundingBox())!;
  expect(await drawer.boundingBox()).toEqual(resized);
  const card = (await frame.boundingBox())!;
  expect(card.x + card.width).toBeCloseTo(resized.x + resized.width - 8, 1);
  expect(card.height).toBeCloseTo(resized.height - 16, 1);
});

test("focus stays inside, content clicks keep it open, and closing restores the opener", async ({
  page,
}) => {
  const { drawer, launch } = await open(page);
  const input = drawer.getByRole("textbox", { name: "Task name" });
  const close = drawer.getByRole("button", {
    name: "Close drawer",
    exact: true,
  });
  const done = drawer.getByRole("button", { name: "Done", exact: true });
  await expect(input).toBeFocused();
  await input.press("Shift+Tab");
  await expect(close).toBeFocused();
  await close.press("Shift+Tab");
  await expect(done).toBeFocused();
  await done.press("Tab");
  await expect(close).toBeFocused();
  await drawer
    .getByText("The host owns task content and actions.", { exact: false })
    .click();
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(launch).toBeFocused();
  await expect(page.getByLabel("Completed closes")).toHaveText("1");
  await launch.click();
  await page.mouse.click(1, 1);
  await expect(drawer).toHaveCount(0);
  await expect(page.getByLabel("Completed closes")).toHaveText("2");
});

test("protected dismissal still permits caller-defined close actions", async ({
  page,
}) => {
  const { drawer } = await open(page, "protected");
  await page.keyboard.press("Escape");
  await page.mouse.click(1, 1);
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: "Done", exact: true }).click();
  await expect(drawer).toHaveCount(0);
});

test("long content scrolls in Nox ScrollArea without moving the card heading or footer", async ({
  page,
}) => {
  const { drawer } = await open(page, "long-content");
  const header = drawer.locator(".card-heading");
  const footer = drawer.locator(".card-footer");
  const before = [await header.boundingBox(), await footer.boundingBox()];
  const viewport = drawer.locator('[data-scroll-area="viewport"]');
  expect(
    await viewport.evaluate((node) => node.scrollHeight > node.clientHeight),
  ).toBe(true);
  await viewport.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  expect([await header.boundingBox(), await footer.boundingBox()]).toEqual(
    before,
  );
  await expect(
    drawer.getByRole("button", { name: "Done", exact: true }),
  ).toBeVisible();
});

test("exit completes once and StrictMode replay does not report a close", async ({
  page,
}) => {
  const { drawer, launch } = await open(
    page,
    "strict-lifecycle",
    "no-preference",
  );
  await expect(page.getByLabel("Completed closes", { exact: true })).toHaveText(
    "0",
  );
  await drawer.getByRole("button", { name: "Done", exact: true }).click();
  const exiting = page.locator('[data-drawer="root"]');
  await expect(exiting).toHaveAttribute("data-closing", "true");
  await expect(exiting).toHaveAttribute("inert", "");
  await expect(exiting).toHaveCount(0);
  await expect(launch).toBeFocused();
  await expect(page.getByLabel("Completed closes", { exact: true })).toHaveText(
    "1",
  );
});

test("Drawer accepts a custom surface without inserting DrawerCard", async ({
  page,
}) => {
  const { drawer } = await open(page, "without-card");
  await expect(drawer.locator(".floating-card")).toHaveCount(0);
  await expect(
    drawer.getByRole("heading", { name: "Custom content" }),
  ).toBeVisible();
  await drawer
    .getByRole("button", { name: "Close drawer", exact: true })
    .click();
  await expect(drawer).toHaveCount(0);
});

test("reopening during exit cancels the pending close lifecycle", async ({
  page,
}) => {
  const { drawer, launch } = await open(page, "default", "no-preference");
  await drawer.getByRole("button", { name: "Done", exact: true }).click();
  await launch.evaluate((node: HTMLButtonElement) => node.click());
  await expect(page.locator('[data-drawer="root"]')).toHaveAttribute(
    "data-closing",
    "false",
  );
  await expect(
    drawer.getByRole("textbox", { name: "Task name" }),
  ).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page.getByLabel("Completed closes", { exact: true })).toHaveText(
    "0",
  );
  await drawer.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator('[data-drawer="root"]')).toHaveCount(0);
  await expect(page.getByLabel("Completed closes", { exact: true })).toHaveText(
    "1",
  );
});
