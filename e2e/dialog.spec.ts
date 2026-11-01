import { expect, test } from "@playwright/test";

const story = (name: string) =>
  `/iframe.html?id=components-dialog--${name}&viewMode=story`;

test("caller-owned Card and decoration share the modal lifecycle without a duplicate frame", async ({
  page,
}) => {
  await page.goto(story("custom-card"));
  const launch = page.getByRole("button", { name: "Open dialog", exact: true });
  await launch.click();
  const dialog = page.getByRole("dialog", { name: "Custom card" });
  await expect(dialog.locator(".floating-card")).toHaveCount(1);
  const surface = dialog.locator('[data-motion="default"]');
  await expect(surface).toHaveAttribute("data-anchored", "true");
  await expect(surface).toHaveCSS("transform-origin", "0px 0px");
  await expect(surface.locator("[data-custom-decoration]")).toHaveCount(0);
  await expect(dialog.locator(":scope > [data-custom-decoration]")).toHaveCount(
    1,
  );
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.locator("dialog")).toHaveCount(0);
  await expect(launch).toBeFocused();
});

test("exit keeps the native modal until surface and backdrop finish, then restores focus once", async ({
  page,
}) => {
  await page.goto(story("closing-motion"));
  const launch = page.getByRole("button", { name: "Open dialog", exact: true });
  await launch.click();
  const dialog = page.locator("dialog");
  await dialog.evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
    node.style.setProperty("--ui-dialog-exit-duration", "2s");
    // Caller content must not hold the modal open indefinitely.
    const body = node.querySelector(".dialog-body")!;
    body.animate([{ opacity: 0.8 }, { opacity: 1 }], {
      duration: 1000,
      iterations: Infinity,
    });
  });
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toHaveAttribute("data-closing", "true");
  const state = await dialog.evaluate((node: HTMLDialogElement) => {
    const surface = node.querySelector<HTMLElement>('[data-motion="default"]')!;
    const animations = node
      .getAnimations({ subtree: true })
      .filter((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target;
        return target === node || target === surface;
      });
    for (const animation of animations) {
      animation.pause();
      animation.currentTime = 1000;
    }
    return {
      modal: node.matches(":modal"),
      open: node.open,
      inert: node.inert,
      opacity: Number(getComputedStyle(surface).opacity),
      backdropOpacity: Number(getComputedStyle(node, "::backdrop").opacity),
      animations: animations.length,
    };
  });
  expect(state).toMatchObject({
    modal: true,
    open: true,
    inert: true,
    animations: 2,
  });
  expect(state.opacity).toBeGreaterThan(0);
  expect(state.opacity).toBeLessThan(1);
  expect(state.backdropOpacity).toBeGreaterThan(0);
  expect(state.backdropOpacity).toBeLessThan(1);
  await expect(page.getByRole("status", { includeHidden: true })).toHaveText(
    "Completed closes: 0",
  );
  await launch.evaluate((node: HTMLButtonElement) => node.focus());
  await expect(launch).not.toBeFocused();
  await dialog.evaluate((node) => {
    const surface = node.querySelector('[data-motion="default"]')!;
    for (const animation of surface.getAnimations()) animation.finish();
  });
  await expect(dialog).toHaveJSProperty("open", true);
  await expect(page.getByRole("status", { includeHidden: true })).toHaveText(
    "Completed closes: 0",
  );
  await dialog.evaluate((node) => {
    for (const animation of node.getAnimations({ subtree: true })) {
      if ((animation.effect as KeyframeEffect | null)?.target === node)
        animation.finish();
    }
  });
  await expect(dialog).toHaveCount(0);
  await expect(launch).toBeFocused();
  await expect(page.getByRole("status")).toHaveText("Completed closes: 1");
});

test("reopening cancels pending exit cleanup and reduced motion skips the exit", async ({
  page,
}) => {
  await page.goto(story("closing-motion"));
  const launch = page.getByRole("button", { name: "Open dialog", exact: true });
  await launch.click();
  const dialog = page.locator("dialog");
  await dialog.evaluate((node) =>
    node.style.setProperty("--ui-dialog-exit-duration", "2s"),
  );
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toHaveAttribute("data-closing", "true");
  // Model a new controlled open request from outside the inert page.
  await launch.evaluate((node: HTMLButtonElement) => node.click());
  await expect(dialog).toHaveAttribute("data-closing", "false");
  await dialog.evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
  });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("status", { includeHidden: true })).toHaveText(
    "Completed closes: 0",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(dialog.locator('[data-motion="default"]')).toHaveCSS(
    "animation-name",
    "none",
  );
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(launch).toBeFocused();
  await expect(page.getByRole("status")).toHaveText("Completed closes: 1");
});

test("composed labels, modal focus and opener restoration work through reopen and native close", async ({
  page,
}) => {
  await page.goto(story("default"));
  const launch = page.getByRole("button", { name: "Open dialog", exact: true });
  await expect(page.locator("dialog")).toHaveCount(0);
  for (let index = 0; index < 2; index++) {
    await launch.click();
    const dialog = page.getByRole("dialog", { name: "Workspace information" });
    await expect(dialog).toBeVisible();
    const title = dialog.getByRole("heading", {
      name: "Workspace information",
    });
    expect(await dialog.getAttribute("aria-labelledby")).toBe(
      await title.getAttribute("id"),
    );
    await expect(dialog).toHaveAccessibleDescription(
      "Reusable content with caller-owned actions.",
    );
    const close = dialog.getByRole("button", { name: "Close", exact: true });
    await expect(close).toBeFocused();
    await close.press("Tab");
    await expect(close).toBeFocused();
    await close.press("Shift+Tab");
    await expect(close).toBeFocused();
    if (index === 0) await close.press("Escape");
    else await dialog.evaluate((node: HTMLDialogElement) => node.close());
    await expect(dialog).toHaveCount(0);
    await expect(launch).toBeFocused();
  }
});

test("footer content and button variants are caller-defined and content clicks do not dismiss", async ({
  page,
}) => {
  await page.goto(story("custom-footer"));
  await page.getByRole("button", { name: "Open dialog", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Export data" });
  await expect(dialog.locator(".dialog-footer").getByRole("button")).toHaveText(
    ["JSON", "CSV", "Close"],
  );
  const solid = dialog.getByRole("button", { name: "CSV", exact: true });
  await expect(solid).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await solid.click();
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("status", { includeHidden: true })).toHaveText(
    "CSV exported",
  );
  await dialog.locator(".dialog-body").click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(1, 1);
  await expect(dialog).toHaveCount(0);
});

test("forms choose initial focus, wrap keyboard navigation and submit without built-in action policy", async ({
  page,
}) => {
  await page.goto(story("form"));
  const launch = page.getByRole("button", { name: "Open dialog", exact: true });
  await launch.click();
  const dialog = page.getByRole("dialog", { name: "Edit workspace" });
  const input = dialog.getByRole("textbox", { name: "Workspace name" });
  await expect(input).toBeFocused();
  await input.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await input.fill("New workspace");
  await input.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Saved: New workspace");
  await expect(launch).toBeFocused();
});

test("caller-owned pending policy blocks dismissal and failure can retry", async ({
  page,
}) => {
  await page.goto(`${story("async-action")}&args=failFirst:true`);
  await page.getByRole("button", { name: "Open operation" }).click();
  const dialog = page.getByRole("dialog", { name: "Save workspace" });
  await dialog.evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .map((a) => a.finished.catch(() => {})),
    );
  });
  const bounds = await dialog.boundingBox();
  await expect(
    dialog.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeFocused();
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toHaveAttribute("aria-busy", "true");
  await page.keyboard.press("Escape");
  await page.mouse.click(1, 1);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("alert")).toContainText(
    "Save failed. Try again.",
  );
  await expect(dialog.getByRole("alert")).toHaveAttribute(
    "data-action-error-overlay",
    "true",
  );
  expect(await dialog.boundingBox()).toEqual(bounds);
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("Action completed");
});

test("a footer is optional and a dialog with no controls retains keyboard focus", async ({
  page,
}) => {
  await page.goto(story("without-footer"));
  await page.getByRole("button", { name: "Open dialog", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Read-only information" });
  await expect(dialog.locator(".dialog-footer")).toHaveCount(0);
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("long bodies keep the header and footer in the mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 480 });
  await page.goto(story("long-content"));
  await page.getByRole("button", { name: "Open dialog", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Resources" });
  await dialog.evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .map((a) => a.finished.catch(() => {})),
    );
  });
  const header = dialog.locator(".dialog-header"),
    footer = dialog.locator(".dialog-footer");
  const before = {
    header: await header.boundingBox(),
    footer: await footer.boundingBox(),
  };
  const viewport = dialog.locator('.dialog-body [data-scroll-area="viewport"]');
  expect(
    await viewport.evaluate((el) => el.scrollHeight > el.clientHeight),
  ).toBe(true);
  await viewport.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  expect(await header.boundingBox()).toEqual(before.header);
  expect(await footer.boundingBox()).toEqual(before.footer);
  const bounds = (await dialog.boundingBox())!;
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(480);
  await expect(
    dialog.getByRole("button", { name: "Close", exact: true }),
  ).toBeVisible();
});

test("nested dialogs restore focus to the correct layer", async ({ page }) => {
  await page.goto(story("nested"));
  const launch = page.getByRole("button", { name: "Open dialog", exact: true });
  await launch.click();
  const innerLaunch = page.getByRole("button", { name: "Open nested dialog" });
  await innerLaunch.click();
  await expect(page.locator("dialog")).toHaveCount(2);
  await page.getByRole("button", { name: "Close inner" }).click();
  await expect(page.locator("dialog")).toHaveCount(1);
  await expect(innerLaunch).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).toHaveCount(0);
  await expect(launch).toBeFocused();
});
