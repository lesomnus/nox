import { expect, test } from "@playwright/test";

const story = (name: string, args = "") =>
  `/iframe.html?id=components-animatedtext--${name}&viewMode=story${args ? `&args=${args}` : ""}`;
const display = 'span[role="img"][data-motion]';

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
