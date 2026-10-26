import { expect, test, type Locator } from "@playwright/test";

async function segmentStyles(segments: Locator) {
  return segments.evaluateAll((nodes) => {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;visibility:hidden;box-sizing:content-box;padding:0;border:0";
    document.body.append(probe);
    const result = nodes.map((node) => {
      const css = getComputedStyle(node);
      const parts: string[] = [];
      let depth = 0,
        start = 0;
      for (let index = 0; index < css.strokeDasharray.length; index++) {
        const character = css.strokeDasharray[index];
        if (character === "(") depth++;
        if (character === ")") depth--;
        if (character === "," && !depth) {
          parts.push(css.strokeDasharray.slice(start, index));
          start = index + 1;
        }
      }
      parts.push(css.strokeDasharray.slice(start));
      // Resolve calc/min with CSS instead of depending on CSSOM serialization.
      const dash = parts.map((part) => {
        probe.style.width = part.trim();
        return parseFloat(getComputedStyle(probe).width);
      });
      return { color: css.stroke, dash, duration: css.animationDuration };
    });
    probe.remove();
    return result;
  });
}

test("presses scale only the label while the border stays fixed and activation waits for release", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-bordertrailbutton--interaction&viewMode=story",
  );
  const button = page.getByRole("button", { name: "Job count" });
  const border = button.locator('[data-border-trail="border"]');
  const track = button.locator('[data-border-trail="track"]');
  const content = button.locator(".button-content");
  await expect(button.locator("path")).toHaveAttribute("d", /^M /);
  await page.getByRole("button", { name: "Focus trails" }).click();
  await expect(button).toBeFocused();
  const outer = await button.boundingBox(),
    outline = await border.boundingBox(),
    line = await track.boundingBox();
  const width = (await content.boundingBox())!.width;
  await button.hover();
  await page.mouse.down();
  await expect
    .poll(async () => (await content.boundingBox())!.width)
    .toBeLessThan(width);
  expect(await border.boundingBox()).toEqual(outline);
  expect(await track.boundingBox()).toEqual(line);
  expect(await button.boundingBox()).toEqual(outer);
  await expect(page.getByRole("status")).toHaveText("Clicks: 0");
  await page.mouse.up();
  await expect(page.getByRole("status")).toHaveText("Clicks: 1");
  await expect
    .poll(async () => (await content.boundingBox())!.width)
    .toBeCloseTo(width, 1);
  await page.keyboard.down("Space");
  await expect
    .poll(async () => (await content.boundingBox())!.width)
    .toBeLessThan(width);
  expect(await border.boundingBox()).toEqual(outline);
  await expect(page.getByRole("status")).toHaveText("Clicks: 1");
  await page.keyboard.up("Space");
  await expect(page.getByRole("status")).toHaveText("Clicks: 2");
  await page.getByRole("button", { name: "Add segment" }).click();
  await expect(button.locator('[data-border-trail="segment"]')).toHaveCount(4);
});

test("segment colors, lengths, starting positions and lap times are independent", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-bordertrailbutton--custom-segments&viewMode=story",
  );
  const button = page.getByRole("button", {
    name: "Independent colors and speeds",
  });
  const segments = button.locator('[data-border-trail="segment"]');
  await expect(segments).toHaveCount(3);
  const styles = await segmentStyles(segments);
  expect(styles.map((s) => s.color)).toEqual([
    "rgb(120, 217, 239)",
    "rgb(197, 139, 239)",
    "rgb(217, 255, 48)",
  ]);
  expect(styles.map((s) => s.dash)).toEqual([
    [16, 84],
    [8, 92],
    [6, 94],
  ]);
  expect(styles.map((s) => s.duration.split(",")[0].trim())).toEqual([
    "15s",
    "11s",
    "19s",
  ]);
  const first = segments.first();
  const offset = await first.evaluate(
    (node) => getComputedStyle(node).strokeDashoffset,
  );
  await expect
    .poll(() =>
      first.evaluate((node) => getComputedStyle(node).strokeDashoffset),
    )
    .not.toBe(offset);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const segment of await segments.all())
    await expect(segment).toHaveCSS("animation-name", "none");
  expect(
    await segments.evaluateAll((nodes) =>
      nodes.map((node) =>
        parseFloat(
          getComputedStyle(node).strokeDashoffset.replace(/^calc\(/, ""),
        ),
      ),
    ),
  ).toEqual([0, -35, -70]);
});

test("the painted colored segment travels along the perimeter", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(
    "/iframe.html?id=components-bordertrailbutton--custom-segments&viewMode=story",
  );
  const button = page.getByRole("button", {
    name: "Independent colors and speeds",
  });
  await expect(button.locator("path")).toHaveAttribute("d", /^M /);
  const frame = (await button.boundingBox())!;
  const positions: { x: number; y: number }[] = [];
  for (const phase of [0, 0.25]) {
    const moving = await button.evaluate((node, phase) => {
      let moving = 0;
      for (const animation of node.getAnimations({ subtree: true })) {
        animation.pause();
        const drift = (animation as CSSAnimation).animationName.includes(
          "drift",
        );
        if (drift) moving++;
        animation.currentTime = drift
          ? Number(animation.effect!.getTiming().duration) * phase
          : 0;
      }
      return moving;
    }, phase);
    expect(moving).toBe(3);
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    const png = await page.screenshot({
      path: testInfo.outputPath(`border-phase-${phase}.png`),
    });
    await testInfo.attach(`border-phase-${phase}`, {
      body: png,
      contentType: "image/png",
    });
    const color = await page.evaluate(
      async ({ base64, frame }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const scale = image.width / innerWidth;
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(frame.width * scale);
        canvas.height = Math.ceil(frame.height * scale);
        const context = canvas.getContext("2d")!;
        context.drawImage(image, -frame.x * scale, -frame.y * scale);
        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;
        let count = 0,
          x = 0,
          y = 0;
        for (let index = 0; index < pixels.length; index += 4) {
          // Only the cyan trail; the label, quiet track and other colors do not qualify.
          if (
            pixels[index + 1] > pixels[index] + 18 &&
            pixels[index + 2] > pixels[index] + 18
          ) {
            count++;
            x += (index / 4) % canvas.width;
            y += Math.floor(index / 4 / canvas.width);
          }
        }
        return { count, x: x / count / scale, y: y / count / scale };
      },
      { base64: png.toString("base64"), frame },
    );
    expect(color.count).toBeGreaterThan(10);
    positions.push(color);
    expect(await button.boundingBox()).toEqual(frame);
  }
  expect(positions[1].x - positions[0].x).toBeGreaterThan(frame.width / 8);
});

test("counts beyond the old cap stay separated, while inactive and empty trails preserve layout", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-bordertrailbutton--many-segments&viewMode=story",
  );
  const button = page.getByRole("button", {
    name: "Twelve independent trails",
  });
  const segments = button.locator('[data-border-trail="segment"]');
  await expect(segments).toHaveCount(12);
  const lengths = (await segmentStyles(segments)).map((style) => style.dash[0]);
  expect(lengths.every((length) => length > 0 && length < 100 / 12)).toBe(true);
  await page.goto(
    "/iframe.html?id=components-bordertrailbutton--inactive&viewMode=story",
  );
  const inactive = page.getByRole("button", { name: "Background jobs" });
  await expect(inactive.locator('[data-border-trail="track"]')).toBeVisible();
  const hidden = inactive.locator('[data-border-trail="segment"]').first();
  await expect(hidden).toHaveCSS("opacity", "0");
  await expect(hidden).toHaveCSS("animation-play-state", "paused");
  await page.goto(
    "/iframe.html?id=components-bordertrailbutton--track-only&viewMode=story",
  );
  await expect(page.locator('[data-border-trail="segment"]')).toHaveCount(0);
  await expect(page.locator('[data-border-trail="track"]')).toBeVisible();
  await page.goto(
    "/iframe.html?id=components-bordertrailbutton--disabled&viewMode=story",
  );
  await expect(
    page.getByRole("button", { name: "Background jobs" }),
  ).toBeDisabled();
});

test("the path follows pill and asymmetric CSS corners and updates after resizing", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-bordertrailbutton--shapes&viewMode=story",
  );
  const pill = page.getByRole("button", { name: "Rounded" }),
    path = pill.locator("path");
  await expect(path).toHaveAttribute("d", /^M /);
  const before = await path.getAttribute("d");
  const geometry = await pill
    .locator('[data-border-trail="track"]')
    .evaluate((node) => {
      const box = (node as SVGGraphicsElement).getBBox();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    });
  const size = await pill.boundingBox();
  expect(geometry.width).toBeCloseTo(size!.width - 1, 1);
  expect(geometry.height).toBeCloseTo(size!.height - 1, 1);
  await pill.evaluate((node) => {
    node.style.width = "240px";
    node.style.borderRadius = "4px 18px 9px 12px";
  });
  await expect.poll(() => path.getAttribute("d")).not.toBe(before);
  await expect(path).toHaveAttribute("d", /A 17\.5 17\.5/);
  const asymmetric = page
    .getByRole("button", { name: "Different corners" })
    .locator("path");
  await expect(asymmetric).toHaveAttribute("d", /A 15\.5 15\.5/);
});

test("progress grows one color smoothly before starting the next", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-bordertrailbutton--progressive&viewMode=story",
  );
  const button = page.getByRole("button", { name: "Progressive work" });
  const segments = button.locator('[data-border-trail="segment"]');
  await expect(segments).toHaveCount(1);
  const limit = await button.evaluate((node) =>
    Number(
      getComputedStyle(node).getPropertyValue(
        "--ui-border-trail-progress-length",
      ),
    ),
  );
  const initial = (await segmentStyles(segments))[0];
  expect(initial.dash[0]).toBeCloseTo(limit / 8, 1);
  const frame = await button.boundingBox();
  await page.getByRole("button", { name: "Add unit", exact: true }).click();
  await expect(button).toHaveText("2 jobs");
  const growing = await segments.first().evaluate((node) => {
    const transitions = node
      .getAnimations()
      .filter(
        (animation) =>
          animation instanceof CSSTransition &&
          animation.transitionProperty === "stroke-dasharray",
      );
    for (const transition of transitions) {
      transition.pause();
      transition.currentTime =
        Number(transition.effect!.getTiming().duration) / 2;
    }
    return transitions.length;
  });
  expect(growing).toBe(1);
  const middle = (await segmentStyles(segments))[0].dash[0];
  expect(middle).toBeGreaterThan(initial.dash[0]);
  expect(middle).toBeLessThan(limit / 4);
  await button.evaluate((node) => {
    for (const animation of node.getAnimations({ subtree: true }))
      if (animation instanceof CSSTransition) animation.finish();
  });
  await page.getByRole("button", { name: "Fill first color" }).click();
  await expect(segments).toHaveCount(1);
  await expect
    .poll(async () => (await segmentStyles(segments))[0].dash[0])
    .toBeCloseTo(limit, 1);
  await page.getByRole("button", { name: "Start next color" }).click();
  await expect(segments).toHaveCount(2);
  const next = await segmentStyles(segments);
  expect(next[0].dash[0]).toBeCloseTo(limit, 1);
  expect(next[1].dash[0]).toBeCloseTo(limit / 8, 1);
  expect(next[0].color).toBe(initial.color);
  expect(next[1].color).not.toBe(next[0].color);
  await page.getByRole("button", { name: "Third color" }).click();
  await expect(segments).toHaveCount(3);
  await expect
    .poll(async () => (await segmentStyles(segments))[1].dash[0])
    .toBeCloseTo(limit, 1);
  expect((await segmentStyles(segments))[2].dash[0]).toBeCloseTo(limit / 8, 1);
  expect(await button.boundingBox()).toEqual(frame);
});

test("the painted sheen moves within a stationary segment and reduced motion hides it", async ({
  page,
}, testInfo) => {
  await page.goto(
    "/iframe.html?id=components-bordertrailbutton--sheen&viewMode=story",
  );
  const button = page.getByRole("button", { name: "Traveling light" });
  await expect(button.locator("path")).toHaveAttribute("d", /^M /);
  const frame = (await button.boundingBox())!;
  const positions: { x: number; y: number }[] = [];
  for (const phase of [0.2, 0.8]) {
    await button.evaluate((node, phase) => {
      for (const animation of node.getAnimations({ subtree: true })) {
        animation.pause();
        const sweep = (animation as CSSAnimation).animationName?.includes(
          "sweep",
        );
        animation.currentTime = sweep
          ? Number(animation.effect!.getTiming().duration) * phase
          : 0;
      }
    }, phase);
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    const png = await page.screenshot({
      path: testInfo.outputPath(`sheen-phase-${phase}.png`),
    });
    const bright = await page.evaluate(
      async ({ base64, frame }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const scale = image.width / innerWidth,
          canvas = document.createElement("canvas");
        canvas.width = Math.ceil(frame.width * scale);
        canvas.height = Math.ceil(frame.height * scale);
        const context = canvas.getContext("2d")!;
        context.drawImage(image, -frame.x * scale, -frame.y * scale);
        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;
        let count = 0,
          x = 0,
          y = 0;
        for (let index = 0; index < pixels.length; index += 4) {
          const px = ((index / 4) % canvas.width) / scale,
            py = Math.floor(index / 4 / canvas.width) / scale;
          if (px > 3 && px < frame.width - 3 && py > 3 && py < frame.height - 3)
            continue;
          if (
            Math.min(pixels[index], pixels[index + 1], pixels[index + 2]) >
              100 &&
            Math.max(pixels[index], pixels[index + 1], pixels[index + 2]) -
              Math.min(pixels[index], pixels[index + 1], pixels[index + 2]) <
              45
          ) {
            count++;
            x += px;
            y += py;
          }
        }
        return { count, x: x / count, y: y / count };
      },
      { base64: png.toString("base64"), frame },
    );
    expect(bright.count).toBeGreaterThan(3);
    positions.push(bright);
  }
  expect(
    Math.hypot(
      positions[1].x - positions[0].x,
      positions[1].y - positions[0].y,
    ),
  ).toBeGreaterThan(frame.width / 5);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(button.locator('[data-border-trail="sheen"]')).toBeHidden();
  await expect(button.locator('[data-border-trail="segment"]')).toBeVisible();
});
