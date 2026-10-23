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
