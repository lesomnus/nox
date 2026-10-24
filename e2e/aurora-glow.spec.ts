import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    auroraAnimations: Animation[];
  }
}

const layer = "[data-aurora-glow]";
async function open(page: Page, story = "lifecycle") {
  await page.goto(
    `/iframe.html?id=effects-auroraglow--${story}&viewMode=story&args=seed:42`,
  );
  await expect(page.locator(layer)).toBeAttached();
  await page.addStyleTag({
    content: `${layer} { --ui-aurora-envelope-duration: 400ms; }`,
  });
}

async function update(page: Page, args: Record<string, unknown>) {
  await page.evaluate((updatedArgs) => {
    const channel = (
      window as unknown as {
        __STORYBOOK_ADDONS_CHANNEL__: {
          emit: (name: string, payload: unknown) => void;
        };
      }
    ).__STORYBOOK_ADDONS_CHANNEL__;
    channel.emit("updateStoryArgs", {
      storyId: "effects-auroraglow--standalone",
      updatedArgs,
    });
  }, args);
}

test("blooms, freezes, contracts while drifting and safely reactivates", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page);
  const glow = page.locator(layer);
  const active = page.getByRole("button", { name: "Active", exact: true });
  await expect(glow).toHaveAttribute("data-running", "false");
  await active.click();
  await expect(glow).toHaveAttribute("data-running", "true");
  await expect(glow.locator(":scope > div")).toHaveCSS("opacity", "0.5");
  const paused = page.getByRole("button", { name: "Paused", exact: true });
  await paused.click();
  await expect(glow).toHaveAttribute("data-running", "false");
  await expect
    .poll(() =>
      glow.evaluate((node) =>
        node
          .getAnimations({ subtree: true })
          .every((a) => a.playState === "paused"),
      ),
    )
    .toBe(true);
  await expect(glow.locator(":scope > div")).toHaveCSS("opacity", "0.5");
  await paused.click();
  await active.click();
  await expect(glow).toHaveAttribute("data-active", "false");
  await expect(glow).toHaveAttribute("data-running", "true");
  await active.click();
  await page.waitForTimeout(500);
  await expect(glow).toHaveAttribute("data-running", "true");
  await active.click();
  await expect(glow).toHaveAttribute("data-running", "false");
  await expect(glow.locator(":scope > div")).toHaveCSS("opacity", "0");
  await active.click();
  await glow.evaluate((node) => {
    window.auroraAnimations = node.getAnimations({ subtree: true });
  });
  await page.getByRole("button", { name: "Mounted", exact: true }).click();
  await expect(glow).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.auroraAnimations.every((a) => a.playState === "idle"),
      ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Mounted", exact: true }).click();
  await expect(glow).toHaveAttribute("data-running", "true");
  expect(errors).toEqual([]);
});

test("sleeps when hidden or offscreen without resetting the motion", async ({
  page,
}) => {
  await open(page, "standalone");
  const glow = page.locator(layer);
  await expect(glow).toHaveAttribute("data-running", "true");
  await glow.evaluate((node) => {
    window.auroraAnimations = node.getAnimations({ subtree: true });
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(glow).toHaveAttribute("data-running", "false");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(glow).toHaveAttribute("data-running", "true");
  await glow.evaluate((node) => {
    (node.parentElement as HTMLElement).style.transform = "translateY(200vh)";
  });
  await expect(glow).toHaveAttribute("data-running", "false");
  await glow.evaluate((node) => {
    (node.parentElement as HTMLElement).style.transform = "";
  });
  await expect(glow).toHaveAttribute("data-running", "true");
  expect(
    await glow.evaluate((node) =>
      window.auroraAnimations
        .filter((a) => !(a instanceof CSSTransition))
        .every((a) => node.getAnimations({ subtree: true }).includes(a)),
    ),
  ).toBe(true);
});

test("updates rate and palette without replacing live motion", async ({
  page,
}) => {
  await open(page, "standalone");
  const glow = page.locator(layer);
  await expect(glow).toHaveAttribute("data-running", "true");
  await glow.evaluate((node) => {
    window.auroraAnimations = node
      .getAnimations({ subtree: true })
      .filter((a) => !(a instanceof CSSTransition));
  });
  await update(page, { speed: 2, palette: ["#f00", "#0f0", "#00f"] });
  await expect
    .poll(() =>
      glow.evaluate((node) =>
        node
          .getAnimations({ subtree: true })
          .filter((a) => !(a instanceof CSSTransition))
          .every((a) => a.playbackRate === 2),
      ),
    )
    .toBe(true);
  expect(
    await glow.evaluate((node) =>
      window.auroraAnimations.every((a) =>
        node.getAnimations({ subtree: true }).includes(a),
      ),
    ),
  ).toBe(true);
  await expect
    .poll(() =>
      glow.evaluate((node) =>
        getComputedStyle(node).getPropertyValue("--ui-aurora-color-1").trim(),
      ),
    )
    .toBe("#f00");
  await update(page, { speed: 0 });
  await expect(glow).toHaveAttribute("data-running", "false");
  await update(page, { speed: 1 });
  await expect(glow).toHaveAttribute("data-running", "true");
});

test("reduced motion and unavailable Web Animations leave a usable static layer", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "standalone");
  const glow = page.locator(layer);
  await expect(glow).toHaveAttribute("data-running", "false");
  await expect(glow.locator(":scope > div")).toHaveCSS("opacity", "0.5");
  expect(
    await glow.evaluate((node) => node.getAnimations({ subtree: true }).length),
  ).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(glow).toHaveAttribute("data-running", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(glow).toHaveAttribute("data-running", "false");
  expect(
    await glow.evaluate((node) => node.getAnimations({ subtree: true }).length),
  ).toBe(0);
  await page.addInitScript(() => {
    Object.defineProperty(Element.prototype, "animate", { value: undefined });
    Object.defineProperty(Element.prototype, "getAnimations", {
      value: undefined,
    });
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await expect(glow).toHaveAttribute("data-active", "true");
  await expect(glow).toHaveAttribute("data-running", "false");
});

test("renders moving colors inside its frame and leaves toolbar controls clickable", async ({
  page,
}) => {
  await open(page, "toolbar");
  const glow = page.locator(layer);
  await expect(glow).toHaveAttribute("aria-hidden", "true");
  await expect(glow).toHaveCSS("pointer-events", "none");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(glow).toHaveAttribute("data-running", "true");
  await expect(glow.locator(":scope > div")).toHaveCSS("opacity", "0.5");
  const sample = async (time: number) => {
    await glow.evaluate((node, time) => {
      for (const a of node.getAnimations({ subtree: true })) {
        if (a instanceof CSSTransition) a.finish();
        else {
          a.pause();
          a.currentTime = time;
        }
      }
    }, time);
    return glow.screenshot({ animations: "allow" });
  };
  const first = await sample(6000);
  const second = await sample(14000);
  expect(first.equals(second)).toBe(false);
  await page.screenshot({ path: "/tmp/nox-aurora-toolbar.png" });
  expect(
    await page.evaluate(() => ({
      x: document.documentElement.scrollWidth > innerWidth,
      y: document.documentElement.scrollHeight > innerHeight,
    })),
  ).toEqual({ x: false, y: false });
});
