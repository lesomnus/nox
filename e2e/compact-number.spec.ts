import { expect, test } from "@playwright/test";

for (const [component, story, placeholder] of [
  ["compactnumber", "initial-slide", "----·"],
  ["compactnumber", "initial-integer-slide", "---"],
  ["durationdisplay", "initial-slide", "------"],
]) {
  test(`${component} ${story} paints sized dashes while the first value waits to slide`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-${component}--${story}&viewMode=story&args=duration:60000;characterDelay:10000`,
    );
    const value = page.getByRole("img").first();
    await expect(value.locator("[data-changing]")).toHaveCount(
      placeholder.length,
    );
    await value.evaluate((node) => {
      for (const animation of node.getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = 0;
      }
    });
    const outgoing = await value
      .locator("[data-changing]")
      .evaluateAll((cells) =>
        cells.map((cell) => {
          const layer = cell.querySelector(
            '[data-slide-frame="0"]',
          ) as HTMLElement;
          return {
            text: layer.textContent,
            visible: getComputedStyle(layer).visibility,
            width: layer.getBoundingClientRect().width,
          };
        }),
      );
    expect(outgoing.map(({ text }) => text).join("")).toBe(placeholder);
    expect(
      outgoing.every(
        ({ visible, width }) => visible === "visible" && width > 0,
      ),
    ).toBe(true);
  });
}

test("loading digits slide through zero and bounded samples within one duration", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-compactnumber--loading-slide&viewMode=story",
  );
  const number = page.locator('[data-mode="compact"]');
  await expect(number).toHaveText("----·");
  const width = (await number.boundingBox())!.width;
  await page.clock.install();
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(new Date(now + 50));
  await page
    .getByRole("button", { name: "Load value", exact: true })
    .evaluate((node: HTMLButtonElement) => node.click());
  await expect(number).toHaveAttribute("aria-label", "9999999");
  const digit = number.locator('[data-slide-steps="4"]').first();
  await expect(digit.locator("[data-slide-frame]")).toHaveText([
    "-",
    "0",
    "3",
    "6",
    "9",
  ]);
  const travel = await digit.locator("[data-slide-strip]").evaluate((strip) => {
    const animation = strip.getAnimations()[0];
    animation.pause();
    const timing = animation.effect!.getTiming();
    const height = strip.getBoundingClientRect().height;
    const offsets = [0, 150, 300, 450, 600].map((time) => {
      animation.currentTime = time;
      return new DOMMatrix(getComputedStyle(strip).transform).m42 / height;
    });
    return { duration: timing.duration, easing: timing.easing, offsets };
  });
  expect(travel.duration).toBe(600);
  expect(travel.easing).toBe("linear");
  travel.offsets.forEach((offset, index) =>
    expect(offset).toBeCloseTo(index, 4),
  );
  await page.clock.runFor(761);
  await expect(number.locator("[data-changing]")).toHaveCount(0);
  await expect(number).toHaveText("9.99M");
  expect((await number.boundingBox())!.width).toBeCloseTo(width, 2);
});

test("0 to 2 and back cross the intermediate digit at constant speed without a pause", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-compactnumber--continuous-slide&viewMode=story",
  );
  const number = page.locator('[data-mode="integer"]');
  await expect(number).toHaveText("0");
  await page.clock.install();
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(new Date(now + 50));
  for (const [button, frames, sign, target] of [
    ["Two", ["0", "1", "2"], 1, "2"],
    ["Zero", ["2", "1", "0"], -1, "0"],
  ] as const) {
    await page
      .getByRole("button", { name: button, exact: true })
      .evaluate((node: HTMLButtonElement) => node.click());
    const strip = number.locator("[data-slide-strip]");
    await expect(strip.locator("[data-slide-frame]")).toHaveText([...frames]);
    const fractions = [
      0, 0.125, 0.25, 0.375, 0.49, 0.5, 0.51, 0.625, 0.75, 0.875, 1,
    ];
    const motion = await strip.evaluate((node, fractions) => {
      const animation = node.getAnimations()[0];
      animation.pause();
      const timing = animation.effect!.getTiming();
      const height = node.getBoundingClientRect().height;
      const positions = fractions.map((fraction) => {
        animation.currentTime =
          Number(timing.duration) * fraction + Number(timing.delay);
        return new DOMMatrix(getComputedStyle(node).transform).m42 / height;
      });
      return {
        easing: timing.easing,
        positions,
        animations: node.getAnimations().length,
      };
    }, fractions);
    expect(motion.easing).toBe("linear");
    expect(motion.animations).toBe(1);
    motion.positions.forEach((position, index) =>
      expect(position).toBeCloseTo(sign * 2 * fractions[index], 4),
    );
    await page.clock.runFor(601);
    await expect(number.locator("[data-changing]")).toHaveCount(0);
    await expect(number).toHaveText(target);
  }
});

test("new values cancel intermediate slides and reduced motion skips them", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-compactnumber--loading-slide&viewMode=story",
  );
  const number = page.locator('[data-mode="compact"]');
  await expect(number).toHaveText("----·");
  await page.clock.install();
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(new Date(now + 50));
  const click = (name: string) =>
    page
      .getByRole("button", { name, exact: true })
      .evaluate((node: HTMLButtonElement) => node.click());
  await click("Load value");
  await page.clock.runFor(151);
  await click("Update value");
  await page.clock.runFor(800);
  await expect(number).toHaveText("6.54M");
  await expect(number.locator("[data-changing]")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await click("Clear value");
  await expect(number).toHaveText("----·");
  await click("Load value");
  await expect(number).toHaveText("9.99M");
  await expect(number.locator("[data-changing]")).toHaveCount(0);
});

for (const [story, text] of [
  ["readable-millions", "6.54M"],
  ["readable-thousands", "12.3K"],
]) {
  test(`${story} prefers readable units`, async ({ page }) => {
    await page.goto(
      `/iframe.html?id=components-compactnumber--${story}&viewMode=story`,
    );
    await expect(page.locator('[data-mode="compact"]')).toHaveText(text);
  });
}

test("base-unit labels replace only the unscaled unit cell", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-compactnumber--bytes&viewMode=story",
  );
  const number = page.getByRole("img", { name: "55 bytes" });
  await expect(number).toHaveText("0055B");
  const width = (await number.boundingBox())!.width;
  await page.goto(
    "/iframe.html?id=components-compactnumber--bytes&viewMode=story&args=value:1230",
  );
  await expect(number).toHaveText("1.23K");
  expect((await number.boundingBox())!.width).toBeCloseTo(width, 2);
});

for (const [story, text, digits] of [
  ["integer", "0001", 4],
  ["three-digits", "007", 3],
  ["three-digit-overflow", ">99", 3],
] as const) {
  test(`integer ${story} keeps its configured cells and accessible value`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-compactnumber--${story}&viewMode=story`,
    );
    const number = page.locator('[data-mode="integer"]');
    await expect(number).toHaveText(text);
    await expect(number).toHaveAttribute(
      "aria-label",
      story === "three-digit-overflow"
        ? "1234"
        : story === "three-digits"
          ? "7"
          : "1",
    );
    await expect(number).toHaveCSS("--compact-number-digits", String(digits));
    if (story === "three-digits") {
      const leading = number.locator(":scope > span").first();
      const value = number.locator(":scope > span").nth(1);
      await expect(leading).toHaveText("00");
      expect(
        await leading.evaluate((el) => getComputedStyle(el).color),
      ).not.toBe(await value.evaluate((el) => getComputedStyle(el).color));
      const before = (await number.boundingBox())!.width;
      await page.goto(
        "/iframe.html?id=components-compactnumber--three-digits&viewMode=story&args=value:42",
      );
      await expect(number).toHaveText("042");
      expect((await number.boundingBox())!.width).toBeCloseTo(before, 2);
    }
  });
}

for (const theme of ["dark", "light"] as const) {
  for (const mode of ["compact", "integer"] as const) {
    test(`${theme} ${mode} zero and muted values use the intermediate color without changing cells`, async ({
      page,
    }) => {
      const open = async (story: string) => {
        await page.goto(
          `/iframe.html?id=components-compactnumber--${story}&viewMode=story`,
        );
        const number = page.locator(`[data-mode="${mode}"]`);
        await expect(number).toBeVisible();
        await page.evaluate((theme) => {
          document.documentElement.dataset.uiTheme = theme;
          document.documentElement.dataset.theme = theme;
        }, theme);
        return number;
      };
      const normal = await open(mode === "integer" ? "three-digits" : "single");
      const colors = await normal.evaluate((el) => ({
        value: getComputedStyle(el).getPropertyValue("--ui-text-value"),
        intermediate: getComputedStyle(el).getPropertyValue(
          "--ui-text-separator",
        ),
        leading: getComputedStyle(el).getPropertyValue("--ui-text-leading"),
      }));
      const width = (await normal.boundingBox())!.width;
      const normalColor = await normal.evaluate(
        (el) => getComputedStyle(el).color,
      );
      const leadingColor = await normal
        .locator(":scope > span")
        .first()
        .evaluate((el) => getComputedStyle(el).color);
      expect(colors.value).not.toBe(colors.intermediate);
      expect(colors.leading).not.toBe(colors.intermediate);

      let intermediateColor: string | undefined;
      for (const [story, text, label] of mode === "integer"
        ? [
            ["integer-zero", "000", "0"],
            ["muted-integer", "007", "7"],
          ]
        : [
            ["zero", "0000·", "0"],
            ["muted", "1.23K", "1230"],
          ]) {
        const number = await open(story);
        await expect(number).toHaveText(text);
        await expect(number).toHaveAttribute("aria-label", label);
        const value = number.locator(":scope > span").nth(1);
        const valueColor = await value.evaluate(
          (el) => getComputedStyle(el).color,
        );
        expect(valueColor).not.toBe(normalColor);
        expect(valueColor).not.toBe(leadingColor);
        if (intermediateColor) expect(valueColor).toBe(intermediateColor);
        intermediateColor = valueColor;
        await expect(number.locator(":scope > span").first()).toHaveCSS(
          "color",
          leadingColor,
        );
        if (mode === "compact")
          await expect(number.locator(":scope > span").last()).toHaveCSS(
            "color",
            valueColor,
          );
        expect((await number.boundingBox())!.width).toBeCloseTo(width, 2);
      }
    });
  }
}
