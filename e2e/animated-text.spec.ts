import { expect, test, type Page } from "@playwright/test";

const story = (name: string, args = "") =>
  `/iframe.html?id=components-animatedtext--${name}&viewMode=story${args ? `&args=${args}` : ""}`;
const display = 'span[role="img"][data-motion]';

async function frozenStory(page: Page, name: string, args: string) {
  await page.clock.install({ time: new Date("2026-10-23T00:00:00Z") });
  await page.goto(story(name, args));
  await expect(page.locator(display)).toBeVisible();
  await page.clock.pauseAt(new Date("2026-10-23T00:01:00Z"));
}

const delaysOf = (page: Page) =>
  page
    .locator(`${display} [data-changing]`)
    .evaluateAll((cells) =>
      cells.map((cell) =>
        getComputedStyle(cell).getPropertyValue("--animated-text-delay"),
      ),
    );

test("slide stagger skips static positions and waits for the last character to finish", async ({
  page,
}) => {
  await frozenStory(page, "staggered-slide", "characterDelay:200;duration:400");
  const value = page.locator(display);
  await page.getByRole("button", { name: "BOARD", exact: true }).click();
  await expect(value).toHaveAttribute("aria-label", "BOARD");
  expect(await delaysOf(page)).toEqual(["0ms", "200ms", "400ms", "600ms"]);
  const pending = value.locator("[data-changing]").last();
  const frames = await pending.evaluate((cell) =>
    cell.getAnimations({ subtree: true }).map((animation) => {
      animation.pause();
      animation.currentTime = 300;
      const timing = animation.effect!.getComputedTiming();
      return {
        delay: animation.effect!.getTiming().delay,
        progress: timing.progress,
      };
    }),
  );
  expect(frames).toEqual([
    { delay: 600, progress: 0 },
    { delay: 600, progress: 0 },
  ]);
  await expect(pending.locator(":scope > span").nth(1)).toHaveText("Y");
  await page.clock.runFor(401);
  await expect(value.locator("[data-changing]")).toHaveCount(4);
  await page.clock.runFor(600);
  await expect(value.locator("[data-changing]")).toHaveCount(0);
  await expect(value).toHaveText("BOARD");
});

test("staggered multi-flips wait once then run consecutive steps", async ({
  page,
}) => {
  await frozenStory(
    page,
    "staggered-flip",
    "characterDelay:200;duration:900;maxFlipSteps:3",
  );
  const value = page.locator(display);
  await page.getByRole("button", { name: "TOKYO", exact: true }).click();
  expect(await delaysOf(page)).toEqual([
    "0ms",
    "200ms",
    "400ms",
    "600ms",
    "800ms",
  ]);
  const last = value.locator("[data-changing]").last();
  const frame = last.locator("[data-flip-step]");
  const animationDelays = await last.evaluate((cell) =>
    cell
      .getAnimations({ subtree: true })
      .map((animation) => animation.effect!.getTiming().delay),
  );
  expect(animationDelays).toHaveLength(2);
  expect(animationDelays[0]).toBeCloseTo(800);
  expect(animationDelays[1]).toBeCloseTo(950);
  await page.clock.runFor(901);
  await expect(value.locator("[data-changing]")).toHaveCount(5);
  await expect(frame).toHaveAttribute("data-flip-step", "1");
  await page.clock.runFor(201);
  await expect(frame).toHaveAttribute("data-flip-step", "2");
  await expect(frame).toHaveCSS("--animated-text-delay", "0ms");
  await page.clock.runFor(300);
  await expect(frame).toHaveAttribute("data-flip-step", "3");
  await page.clock.runFor(300);
  await expect(value.locator("[data-changing]")).toHaveCount(0);
  await expect(value).toHaveText("TOKYO");
});

test("inline delay callbacks stay frozen through host renders and refresh for the next value", async ({
  page,
}) => {
  await frozenStory(page, "custom-timing", "duration:800");
  const value = page.locator(display);
  await page.getByRole("button", { name: "DDDDD", exact: true }).click();
  await expect(value).toHaveAttribute("aria-label", "DDDDD");
  expect(await delaysOf(page)).toEqual([
    "200ms",
    "0ms",
    "400ms",
    "100ms",
    "300ms",
  ]);
  await page.getByRole("spinbutton", { name: "Delay multiplier" }).fill("2");
  expect(await delaysOf(page)).toEqual([
    "200ms",
    "0ms",
    "400ms",
    "100ms",
    "300ms",
  ]);
  await page.clock.runFor(1201);
  await expect(value).toHaveText("DDDDD");
  await page.getByRole("button", { name: "AAAAA", exact: true }).click();
  await expect(value).toHaveAttribute("aria-label", "AAAAA");
  expect(await delaysOf(page)).toEqual([
    "400ms",
    "0ms",
    "800ms",
    "200ms",
    "600ms",
  ]);
  await page.clock.runFor(801);
  await expect(value.locator("[data-changing]")).toHaveCount(5);
  await page.clock.runFor(800);
  await expect(value).toHaveText("AAAAA");
});

test("a new value cancels pending starts and completion timers", async ({
  page,
}) => {
  await frozenStory(page, "custom-timing", "duration:800");
  await page.getByRole("spinbutton", { name: "Delay multiplier" }).fill("5");
  const value = page.locator(display);
  await page.getByRole("button", { name: "DDDDD", exact: true }).click();
  await page.clock.runFor(100);
  await page.getByRole("button", { name: "AAAAA", exact: true }).click();
  await page.clock.runFor(2750);
  await expect(value).toHaveAttribute("aria-label", "AAAAA");
  await expect(value.locator("[data-changing]")).toHaveCount(5);
  await page.clock.runFor(100);
  await expect(value.locator("[data-changing]")).toHaveCount(0);
  await expect(value).toHaveText("AAAAA");
});

test("irregular callbacks yield bounded delays and time components forward stagger options", async ({
  page,
}) => {
  await page.goto(story("random-flip", "duration:2000"));
  await page.getByRole("button", { name: "TOKYO", exact: true }).click();
  const delays = (await delaysOf(page)).map(parseFloat);
  expect(delays).toHaveLength(5);
  for (const delay of delays) {
    expect(delay).toBeGreaterThanOrEqual(0);
    expect(delay).toBeLessThan(450);
  }
  await page.goto(
    story("rollover", "characterDelay:120;duration:2000;motion:flip"),
  );
  await page.getByRole("button", { name: "Next second" }).click();
  const values = await page
    .locator(".elapsed-time [data-changing]")
    .evaluateAll((cells) =>
      cells.map((cell) =>
        getComputedStyle(cell).getPropertyValue("--animated-text-delay"),
      ),
    );
  expect(values).toEqual(["0ms", "120ms", "240ms"]);
  expect(
    await page
      .locator("time [data-changing]")
      .evaluateAll((cells) =>
        cells.some(
          (cell) =>
            parseFloat(
              getComputedStyle(cell).getPropertyValue("--animated-text-delay"),
            ) > 0,
        ),
      ),
  ).toBe(true);
  await expect(page.locator("[characterDelay]")).toHaveCount(0);
});

test("reduced motion and zero duration skip stagger waits", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(story("staggered-flip", "characterDelay:2000"));
  const value = page.locator(display);
  await page.getByRole("button", { name: "TOKYO", exact: true }).click();
  await expect(value).toHaveText("TOKYO");
  await expect(value.locator("[data-changing]")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(story("staggered-slide", "characterDelay:2000;duration:0"));
  await page.getByRole("button", { name: "BOARD", exact: true }).click();
  await expect(value).toHaveText("BOARD");
  await expect(value.locator("[data-changing]")).toHaveCount(0);
});

test("text examples animate labels and one-way flaps never reverse", async ({
  page,
}) => {
  await page.goto(story("text-slide", "duration:2000"));
  const value = page.locator(display);
  await page.getByRole("button", { name: "BOARD", exact: true }).click();
  await expect(value).toHaveAttribute("aria-label", "BOARD");
  await expect(value.locator("[data-changing]").first()).toBeVisible();
  await page.goto(story("flip-forward-only", "duration:2000"));
  for (const word of ["CLOSED", "BOARD", "READY"]) {
    await page.getByRole("button", { name: word, exact: true }).click();
    await expect(value).toHaveAttribute("aria-label", word);
    await expect(
      value.locator('[data-changing][data-direction="down"]').first(),
    ).toBeVisible();
    await expect(
      value.locator('[data-changing][data-direction="up"]'),
    ).toHaveCount(0);
  }
});

test("distance-dependent flips visit intermediate cards inside the total duration", async ({
  page,
}) => {
  await frozenStory(page, "flip-through", "duration:1200;maxFlipSteps:6");
  const value = page.locator(display);
  await page.getByRole("button", { name: "D", exact: true }).click();
  await expect(value).toHaveAttribute("aria-label", "D");
  await expect(value.locator("[data-flip-steps]")).toHaveAttribute(
    "data-flip-steps",
    "3",
  );
  const frame = value.locator("[data-flip-step]");
  await expect(frame).toHaveAttribute("data-flip-step", "1");
  await expect(frame.locator(":scope > span").first()).toHaveText("B");
  await page.clock.runFor(401);
  await expect(frame).toHaveAttribute("data-flip-step", "2");
  await expect(frame.locator(":scope > span").first()).toHaveText("C");
  await page.clock.runFor(400);
  await expect(frame).toHaveAttribute("data-flip-step", "3");
  await expect(frame.locator(":scope > span").first()).toHaveText("D");
  await page.clock.runFor(400);
  await expect(value.locator("[data-changing]")).toHaveCount(0);
  await expect(value).toHaveText("D");
});

test("long paths respect the cap and interrupted sequences cancel their timers", async ({
  page,
}) => {
  await frozenStory(page, "flip-through", "duration:1200;maxFlipSteps:4");
  const value = page.locator(display);
  await page.getByRole("button", { name: "Z", exact: true }).click();
  await expect(value.locator("[data-flip-steps]")).toHaveAttribute(
    "data-flip-steps",
    "4",
  );
  await expect(value.locator("[data-flip-step] > span").first()).toHaveText(
    "H",
  );
  await page.clock.runFor(601);
  await expect(value.locator("[data-flip-step]")).toHaveAttribute(
    "data-flip-step",
    "3",
  );
  await page.getByRole("button", { name: "A", exact: true }).click();
  await expect(value).toHaveAttribute("aria-label", "A");
  await expect(value.locator("[data-flip-steps]")).toHaveAttribute(
    "data-flip-steps",
    "1",
  );
  await page.clock.runFor(650);
  await expect(value.locator("[data-changing]")).toHaveCount(1);
  await expect(value.locator("[data-flip-step]")).toHaveAttribute(
    "data-flip-step",
    "1",
  );
  await expect(value.locator("[data-flip-step] > span").first()).toHaveText(
    "A",
  );
  await page.clock.runFor(600);
  await expect(value).toHaveText("A");
  await expect(value.locator("[data-changing]")).toHaveCount(0);
});

test("custom alphabets and time components forward the flip options", async ({
  page,
}) => {
  await page.goto(story("korean-text", "duration:2000"));
  const value = page.locator(display);
  await page.getByRole("button", { name: "라마바", exact: true }).click();
  await expect(value).toHaveAttribute("aria-label", "라마바");
  await expect(value.locator('[data-flip-steps="3"]')).toHaveCount(3);
  await page.goto(
    story(
      "rollover",
      "motion:flip;direction:down;duration:2000;maxFlipSteps:4",
    ),
  );
  await page.getByRole("button", { name: "Next second" }).click();
  await expect(page.locator('.elapsed-time [data-flip-steps="4"]')).toHaveCount(
    1,
  );
  await expect(
    page.locator('time [data-flip-steps="4"]').first(),
  ).toBeVisible();
  await expect(page.locator("[maxFlipSteps], [flipCharacters]")).toHaveCount(0);
});

test("multi-step flips skip all intermediate frames with reduced motion or duration zero", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(story("flip-through"));
  const value = page.locator(display);
  await page.getByRole("button", { name: "Z", exact: true }).click();
  await expect(value).toHaveAttribute("aria-label", "Z");
  await expect(value).toHaveText("Z");
  await expect(value.locator("[data-changing]")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(story("flip-through", "duration:0"));
  await page.getByRole("button", { name: "D", exact: true }).click();
  await expect(value).toHaveText("D");
  await expect(value.locator("[data-changing]")).toHaveCount(0);
});

test("slide follows numeric changes and animates only changed characters", async ({
  page,
}) => {
  await page.goto(story("slide", "duration:2000"));
  const value = page.locator(display);
  await expect(value).toHaveAttribute("aria-label", "59");
  await expect(value.locator("[data-changing]")).toHaveCount(0);
  await page.getByRole("button", { name: "Increase", exact: true }).click();
  await expect(value).toHaveAttribute("aria-label", "60");
  await expect(
    value.locator('[data-changing][data-direction="down"]'),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "Increase", exact: true }).click();
  await expect(value).toHaveAttribute("aria-label", "61");
  await expect(
    value.locator('[data-changing][data-direction="down"]'),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Decrease", exact: true }).click();
  await expect(value).toHaveAttribute("aria-label", "60");
  await expect(
    value.locator('[data-changing][data-direction="up"]'),
  ).toHaveCount(1);
});

for (const direction of ["up", "down"]) {
  test(`explicit ${direction} direction overrides numeric order`, async ({
    page,
  }) => {
    await page.goto(
      story(direction === "up" ? "slide-up" : "slide-down", "duration:2000"),
    );
    const value = page.locator(display);
    await page.getByRole("button", { name: "Decrease", exact: true }).click();
    await expect(
      value.locator(`[data-changing][data-direction="${direction}"]`),
    ).toHaveCount(1);
    const frames = await value.evaluate((element) =>
      element
        .getAnimations({ subtree: true })
        .flatMap((animation) =>
          (animation.effect as KeyframeEffect).getKeyframes(),
        ),
    );
    expect(
      frames.some((frame) =>
        String(frame.transform).includes(
          direction === "up" ? "translateY(-100%)" : "translateY(100%)",
        ),
      ),
    ).toBe(true);
  });
}

test("split flaps rotate two halves and settle to a single current value", async ({
  page,
}) => {
  await page.goto(story("flip"));
  const value = page.locator(display);
  await page.getByRole("button", { name: "Increase", exact: true }).click();
  await expect(value).toHaveAttribute("aria-label", "60");
  await expect(
    value.locator('[data-motion="flip"][data-changing]'),
  ).toHaveCount(2);
  const frames = await value.evaluate((element) =>
    element
      .getAnimations({ subtree: true })
      .flatMap((animation) =>
        (animation.effect as KeyframeEffect).getKeyframes(),
      ),
  );
  expect(
    frames.some((frame) => String(frame.transform).includes("rotateX")),
  ).toBe(true);
  await expect(value.locator("[data-changing]")).toHaveCount(0);
  await expect(value).toHaveText("60");
});

test("rapid changes replace old transitions without stale cleanup", async ({
  page,
}) => {
  await page.goto(story("slide", "duration:400"));
  const value = page.locator(display);
  for (let index = 0; index < 6; index++)
    await page.getByRole("button", { name: "Increase", exact: true }).click();
  await expect(value).toHaveAttribute("aria-label", "65");
  await expect(value.locator("[data-changing]")).toHaveCount(0);
  await expect(value).toHaveText("65");
});

test("time rollovers follow the whole timestamp in both directions", async ({
  page,
}) => {
  await page.goto(story("rollover"));
  const elapsed = page.locator(".elapsed-time").locator(display);
  await page.getByRole("button", { name: "Next second" }).click();
  await expect(elapsed).toHaveAttribute("aria-label", "00:01:00");
  await expect(
    elapsed.locator('[data-changing][data-direction="down"]'),
  ).toHaveCount(3);
  await expect(page.locator("time")).toHaveAttribute(
    "datetime",
    "2026-10-24T00:00:00.000Z",
  );
  await expect(
    page.locator('time [data-changing][data-direction="up"]'),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Previous second" }).click();
  await expect(elapsed).toHaveAttribute("aria-label", "00:00:59");
  await expect(
    elapsed.locator('[data-changing][data-direction="up"]'),
  ).toHaveCount(3);
});

test("reduced motion and disabled motion update values without animations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(story("flip"));
  const value = page.locator(display);
  await page.getByRole("button", { name: "Increase", exact: true }).click();
  await expect(value).toHaveAttribute("aria-label", "60");
  await expect(value.locator("[data-changing]")).toHaveCount(0);
  expect(
    await value.evaluate(
      (element) => element.getAnimations({ subtree: true }).length,
    ),
  ).toBe(0);
  await page.goto(story("no-motion"));
  await page.getByRole("button", { name: "Decrease", exact: true }).click();
  await expect(value).toHaveAttribute("aria-label", "58");
  await expect(value).toHaveText("58");
  await expect(value.locator("[data-changing]")).toHaveCount(0);
});
