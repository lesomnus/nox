import { expect, test, type Locator } from "@playwright/test";

async function colorProgress(cell: Locator, placeholder?: string) {
  return cell.evaluate((node, placeholder) => {
    const animation = node
      .getAnimations()
      .find((item) =>
        (item.effect as KeyframeEffect)
          .getKeyframes()
          .some((frame) => frame.color !== undefined),
      )!;
    animation.pause();
    const timing = animation.effect!.getTiming();
    const context = document
      .createElement("canvas")
      .getContext("2d", { willReadFrequently: true })!;
    const rgb = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
    };
    animation.currentTime = 0;
    const waiting = rgb(getComputedStyle(node).color);
    const colors = [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
      animation.currentTime =
        Number(timing.delay) + Number(timing.duration) * fraction;
      return rgb(getComputedStyle(node).color);
    });
    return {
      waiting,
      colors,
      duration: timing.duration,
      delay: timing.delay,
      easing: timing.easing,
      placeholder: placeholder ? rgb(placeholder) : undefined,
      foreground: rgb(getComputedStyle(node.closest("[data-mode]")!).color),
    };
  }, placeholder);
}

for (const theme of ["dark", "light"] as const) {
  test(`${theme} placeholders stay gray through the delay and reach foreground only at the end`, async ({
    page,
  }) => {
    await page.goto(
      "/iframe.html?id=components-compactnumber--loading-slide&viewMode=story",
    );
    await page.evaluate((theme) => {
      document.documentElement.dataset.uiTheme = theme;
      document.documentElement.dataset.theme = theme;
    }, theme);
    const number = page.locator('[data-mode="compact"]');
    await expect(number).toHaveText("----·");
    const placeholder = await number.evaluate(
      (node) => getComputedStyle(node).color,
    );
    await page.clock.install();
    const now = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(new Date(now + 50));
    await page
      .getByRole("button", { name: "Load value", exact: true })
      .evaluate((node: HTMLButtonElement) => node.click());
    const digit = number.locator("[data-color-reveal]").nth(2);
    const progress = await colorProgress(digit, placeholder);
    expect(progress.waiting).toEqual(progress.placeholder);
    expect(progress.colors[0]).toEqual(progress.placeholder);
    expect(progress.colors.at(-1)).toEqual(progress.foreground);
    expect(progress.duration).toBe(600);
    expect(progress.delay).toBe(80);
    expect(progress.easing).toBe("linear");
    const distance = (color: number[]) =>
      color.reduce(
        (sum, channel, index) =>
          sum + Math.abs(channel - progress.foreground[index]),
        0,
      );
    const distances = progress.colors.map(distance);
    for (let index = 1; index < distances.length; index++)
      expect(distances[index]).toBeLessThan(distances[index - 1]);
    // The unit retains its separate token instead of fading to the numeric foreground.
    const unit = number
      .locator("[data-motion][aria-label] > span > span")
      .last();
    await expect(unit).not.toHaveAttribute("data-color-reveal");
    await expect(unit).toHaveCSS("color", placeholder);
    await page.clock.runFor(761);
    await expect(number.locator("[data-color-reveal]")).toHaveCount(0);
    await expect(number).toHaveText("9.99M");
  });
}

test("initial integer padding fades to its dimmed token instead of turning white", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-compactnumber--initial-integer-slide&viewMode=story&args=duration:60000;characterDelay:10000",
  );
  const cells = page.locator('[data-mode="integer"] [data-color-reveal]');
  await expect(cells).toHaveCount(3);
  const padding = await colorProgress(cells.first());
  const significant = await colorProgress(cells.last());
  expect(padding.colors[0]).toEqual(significant.colors[0]);
  expect(padding.colors.at(-1)).not.toEqual(significant.foreground);
  expect(significant.colors.at(-1)).toEqual(significant.foreground);
  expect(padding.colors[2]).not.toEqual(padding.colors[0]);
  expect(padding.colors[2]).not.toEqual(padding.colors.at(-1));
});

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
