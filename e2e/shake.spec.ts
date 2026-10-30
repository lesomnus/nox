import { expect, test, type Page } from "@playwright/test";

async function observeMotion(page: Page) {
  await page.addInitScript(() => {
    const original = Element.prototype.animate;
    const state = window as typeof window & { shakes: Animation[] };
    state.shakes = [];
    Element.prototype.animate = function (...args) {
      const animation = original.apply(this, args);
      state.shakes.push(animation);
      return animation;
    };
    let seed = 12345;
    Math.random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
  });
}

async function motions(page: Page) {
  return page.evaluate(() =>
    (window as typeof window & { shakes: Animation[] }).shakes
      .filter((animation) => animation.id.startsWith("nox-shake:"))
      .map((animation) => ({
        id: animation.id,
        target: (animation.effect as KeyframeEffect).target?.getAttribute(
          "data-pin-slot",
        ),
        timing: animation.effect!.getTiming(),
        composite: (animation.effect as KeyframeEffect).composite,
        frames: (animation.effect as KeyframeEffect).getKeyframes(),
      })),
  );
}

test("failed verification makes every slot red and shakes slots independently without moving the input", async ({
  page,
}) => {
  await observeMotion(page);
  await page.goto(
    "/iframe.html?id=patterns-handlerfailures--code-complete&viewMode=story",
  );
  const input = page.getByRole("textbox", { name: "Verification code" });
  const slots = page.locator("[data-pin-slot]");
  const bounds = await input.boundingBox();
  await input.fill("123456");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect.poll(async () => (await motions(page)).length).toBe(6);
  const records = await motions(page);
  expect(records.map((r) => r.target)).toEqual(["0", "1", "2", "3", "4", "5"]);
  expect(new Set(records.map((r) => r.timing.duration)).size).toBeGreaterThan(
    1,
  );
  expect(new Set(records.map((r) => r.timing.delay)).size).toBeGreaterThan(1);
  expect(
    new Set(records.map((r) => JSON.stringify(r.frames))).size,
  ).toBeGreaterThan(1);
  expect(records.every((r) => r.composite === "add")).toBe(true);
  await input.hover();
  await input.focus();
  expect(
    await slots.evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).borderColor),
    ),
  ).toEqual(Array(6).fill("rgb(219, 112, 112)"));
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("123456");
  expect(await input.boundingBox()).toEqual(bounds);
  expect(
    await input.evaluate((node) => [
      (node as HTMLInputElement).selectionStart,
      (node as HTMLInputElement).selectionEnd,
    ]),
  ).toEqual([5, 6]);
  await input.press("ArrowLeft");
  expect((await motions(page)).length).toBe(6);
  await page.evaluate(async () =>
    Promise.all(
      (window as typeof window & { shakes: Animation[] }).shakes
        .filter((a) => a.playState !== "idle")
        .map((a) => a.finished.catch(() => {})),
    ),
  );
  expect(
    await slots.evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).transform),
    ),
  ).toEqual(Array(6).fill("none"));
  await page.getByRole("button", { name: "Dismiss error" }).click();
  await expect(input).toHaveAttribute("aria-invalid", "false");
  await expect(input).toHaveValue("123456");
});

test("Shake can replay, cancel and preserve an existing transform", async ({
  page,
}) => {
  await observeMotion(page);
  await page.goto(
    "/iframe.html?id=effects-shake--default&viewMode=story&args=scaled:true;duration:1200",
  );
  const targets = page.locator("[data-shake-target]");
  await expect(targets).toHaveCount(6);
  const original = await targets.evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node).transform),
  );
  await page.getByRole("button", { name: "Shake targets" }).click();
  await expect.poll(async () => (await motions(page)).length).toBe(6);
  await expect
    .poll(() =>
      targets.evaluateAll(
        (nodes) => nodes.flatMap((node) => node.getAnimations()).length,
      ),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Cancel motion" }).click();
  expect(
    await targets.evaluateAll(
      (nodes) => nodes.flatMap((node) => node.getAnimations()).length,
    ),
  ).toBe(0);
  expect(
    await targets.evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).transform),
    ),
  ).toEqual(original);
  await page.getByRole("button", { name: "Shake targets" }).click();
  await expect.poll(async () => (await motions(page)).length).toBe(12);
  await page.evaluate(async () =>
    Promise.all(
      (window as typeof window & { shakes: Animation[] }).shakes
        .filter((a) => a.playState !== "idle")
        .map((a) => a.finished.catch(() => {})),
    ),
  );
  expect(
    await targets.evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).transform),
    ),
  ).toEqual(original);
});

test("reduced motion keeps all slot errors visible without shaking", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await observeMotion(page);
  await page.goto(
    "/iframe.html?id=patterns-handlerfailures--code-complete&viewMode=story",
  );
  const input = page.getByRole("textbox", { name: "Verification code" });
  await input.fill("123456");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("alert")).toBeVisible();
  expect(await motions(page)).toEqual([]);
  expect(
    await page
      .locator("[data-pin-slot]")
      .evaluateAll((nodes) =>
        nodes.map((node) => getComputedStyle(node).borderColor),
      ),
  ).toEqual(Array(6).fill("rgb(219, 112, 112)"));
});

test("PinInput can disable error shake while retaining focused and hovered slot borders", async ({
  page,
}) => {
  await observeMotion(page);
  await page.goto(
    "/iframe.html?id=components-pininput--invalid&viewMode=story&args=errorShake:false",
  );
  const input = page.getByRole("textbox", { name: "Verification code" });
  await input.fill("123456");
  await input.hover();
  await expect(input).toBeFocused();
  expect(await motions(page)).toEqual([]);
  expect(
    await page
      .locator("[data-pin-slot]")
      .evaluateAll((nodes) =>
        nodes.map((node) => getComputedStyle(node).borderColor),
      ),
  ).toEqual(Array(6).fill("rgb(219, 112, 112)"));
});
