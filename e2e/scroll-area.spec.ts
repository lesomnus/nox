import { expect, test } from "@playwright/test";

for (const offset of [-16, 12]) {
  for (const horizontal of [false, true]) {
    const axis = horizontal ? "horizontal" : "vertical";
    test(`${axis} rail at offset ${offset} stays visible and supports jump, drag and wheel`, async ({
      page,
    }) => {
      await page.goto(
        `/iframe.html?id=layout-scrollarea--outside-both-axes&viewMode=story&args=scrollbarOffset:${offset}`,
      );
      const area = page.locator('[data-scroll-area="root"]');
      const viewport = area.locator('[data-scroll-area="viewport"]');
      const track = area.locator(
        `[data-scroll-area="${horizontal ? "horizontal-rail" : "rail"}"]`,
      );
      const handle = track.locator(
        `[data-scroll-area="${horizontal ? "horizontal-handle" : "handle"}"]`,
      );
      const thumb = track.getByRole("scrollbar");
      await expect(thumb).toBeVisible();
      const box = (await track.boundingBox())!;
      const grab = (await thumb.boundingBox())!;
      const length = horizontal ? box.width : box.height;
      const thumbLength = horizontal ? grab.width : grab.height;
      expect(Number.isInteger(length)).toBe(true);
      expect(Number.isInteger(thumbLength)).toBe(true);
      const x = box.x + box.width * (horizontal ? 0.65 : 0.5);
      const y = box.y + box.height * (horizontal ? 0.5 : 0.65);
      await page.mouse.move(0, 0);
      if (!horizontal) await expect(handle).toHaveCSS("opacity", "0");
      await page.mouse.move(x, y);
      await expect(handle).toHaveCSS("opacity", "1");
      expect(
        await track.evaluate(
          (node, point) => document.elementFromPoint(point.x, point.y) === node,
          { x, y },
        ),
      ).toBe(true);
      const position = () =>
        viewport.evaluate(
          (node, horizontal) => (horizontal ? node.scrollLeft : node.scrollTop),
          horizontal,
        );
      await page.mouse.click(x, y, { button: "right" });
      expect(await position()).toBe(0);
      const max = await viewport.evaluate(
        (node, horizontal) =>
          horizontal
            ? node.scrollWidth - node.clientWidth
            : node.scrollHeight - node.clientHeight,
        horizontal,
      );
      const expected =
        ((length * 0.65 - thumbLength / 2) / (length - thumbLength)) * max;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await expect(area).toHaveAttribute("data-dragging", "true");
      await expect
        .poll(async () => Math.abs((await position()) - expected))
        .toBeLessThan(1);
      await expect(thumb).toBeFocused();
      await expect
        .poll(async () => {
          const moved = (await handle.boundingBox())!;
          return horizontal
            ? moved.x + moved.width / 2
            : moved.y + moved.height / 2;
        })
        .toBeCloseTo(horizontal ? x : y, 0);
      await page.mouse.move(
        horizontal ? box.x + box.width + 30 : x,
        horizontal ? y : box.y + box.height + 30,
      );
      await expect.poll(position).toBe(max);
      await page.mouse.up();
      await expect(area).not.toHaveAttribute("data-dragging", "true");
      await thumb.press("Home");
      await expect.poll(position).toBe(0);
      await thumb.evaluate((node) => (node as HTMLElement).blur());
      await page.mouse.move(0, 0);
      if (!horizontal) await expect(handle).toHaveCSS("opacity", "0");
      await page.mouse.move(x, y);
      await expect(handle).toHaveCSS("opacity", "1");
      await page.mouse.wheel(horizontal ? 100 : 0, horizontal ? 0 : 100);
      await expect.poll(position).toBeGreaterThan(0);
      await thumb.press("Home");
      await expect(thumb).toHaveAttribute("aria-valuenow", "0");
      const start = (await thumb.boundingBox())!;
      await page.mouse.move(
        start.x + start.width / 2,
        start.y + start.height / 2,
      );
      await page.mouse.down();
      expect(await position()).toBe(0);
      await page.mouse.move(
        horizontal ? box.x - 30 : x,
        horizontal ? y : box.y - 30,
      );
      await page.mouse.up();
      await expect.poll(position).toBe(0);
      await thumb.press("End");
      await expect.poll(position).toBe(max);
    });
  }
}

for (const side of ["left", "right"])
  for (const offset of [0, -16, 7.5]) {
    test(`signed offset ${offset} on ${side} aligns both handle centers to the container edges`, async ({
      page,
    }) => {
      await page.goto(
        `/iframe.html?id=layout-scrollarea--outside-both-axes&viewMode=story&args=scrollbarOffset:${offset};scrollbarSide:${side}`,
      );
      const area = page.locator('[data-scroll-area="root"]');
      await expect(area).toHaveAttribute(
        "data-scrollbar-offset",
        String(offset),
      );
      await expect(area.getByRole("scrollbar")).toHaveCount(2);
      const root = (await area.boundingBox())!;
      const vertical = (await area
        .locator('[data-scroll-area="handle"]')
        .boundingBox())!;
      const horizontal = (await area
        .locator('[data-scroll-area="horizontal-handle"]')
        .boundingBox())!;
      expect(
        vertical.x +
          vertical.width / 2 -
          (side === "left" ? root.x : root.x + root.width),
      ).toBeCloseTo(side === "left" ? offset : -offset, 1);
      expect(
        horizontal.y + horizontal.height / 2 - root.y - root.height,
      ).toBeCloseTo(-offset, 1);
      const gap = await area.evaluate((node) =>
        parseFloat(
          getComputedStyle(node).getPropertyValue("--ui-control-inset"),
        ),
      );
      const viewport = (await area
        .locator('[data-scroll-area="viewport"]')
        .boundingBox())!;
      expect(root.height - viewport.height).toBeCloseTo(
        Math.max(0, horizontal.height / 2 + gap + offset),
        1,
      );
    });
  }

test("outside handles keep a full rounded viewport and remain draggable beyond its edge", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=layout-scrollarea--outside&viewMode=story");
  const area = page.locator('[data-scroll-area="root"]');
  const viewport = area.locator('[data-scroll-area="viewport"]');
  const handle = area.locator('[data-scroll-area="handle"]');
  const thumb = area.getByRole("scrollbar", { name: "Scroll entries" });
  await expect(thumb).toBeVisible();
  await area.hover();
  const frame = (await area.boundingBox())!;
  expect((await viewport.boundingBox())!.height).toBe(frame.height);
  expect((await viewport.boundingBox())!.width).toBe(frame.width);
  await expect(viewport).toHaveCSS("border-radius", "12px");
  await expect(area.locator('[data-scroll-area="content"]')).toHaveCSS(
    "padding-right",
    "0px",
  );
  const bar = (await handle.boundingBox())!;
  expect(bar.x).toBeGreaterThan(frame.x + frame.width);
  await page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2);
  await expect(area).toHaveAttribute("data-near", "true");
  await expect(handle).toHaveCSS("opacity", "1");
  const expanded = (await handle.boundingBox())!;
  expect(expanded.x).toBeGreaterThanOrEqual(frame.x + frame.width);
  expect(
    await thumb.evaluate((node) => {
      const handle = node.querySelector<HTMLElement>(
        '[data-scroll-area="handle"]',
      )!;
      const rect = handle.getBoundingClientRect();
      return node.contains(
        document.elementFromPoint(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
        ),
      );
    }),
  ).toBe(true);
  const rail = (await area.locator('[data-scroll-area="rail"]').boundingBox())!;
  await page.mouse.down();
  await page.mouse.move(expanded.x + expanded.width / 2, rail.y + rail.height);
  await page.mouse.up();
  await expect
    .poll(() =>
      viewport.evaluate(
        (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
      ),
    )
    .toBeLessThan(1);
  await thumb.press("Home");
  await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBe(0);
  await thumb.press("End");
  await expect
    .poll(() =>
      viewport.evaluate(
        (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
      ),
    )
    .toBeLessThan(1);
  await page.goto(
    "/iframe.html?id=layout-scrollarea--outside-no-overflow&viewMode=story",
  );
  await expect(page.getByRole("scrollbar")).toHaveCount(0);
});

test("both outside axes preserve the viewport height and horizontal controls track resizing", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-scrollarea--outside-both-axes&viewMode=story",
  );
  const area = page.locator('[data-scroll-area="root"]');
  const viewport = area.locator('[data-scroll-area="viewport"]');
  const horizontal = area.getByRole("scrollbar", { name: "Scroll columns" });
  const vertical = area.getByRole("scrollbar", { name: "Scroll entries" });
  await expect(horizontal).toBeVisible();
  await expect(vertical).toBeVisible();
  const frame = (await area.boundingBox())!;
  expect((await viewport.boundingBox())!.height).toBe(frame.height);
  const handle = (await area
    .locator('[data-scroll-area="horizontal-handle"]')
    .boundingBox())!;
  expect(handle.y).toBeGreaterThan(frame.y + frame.height);
  await horizontal.press("ArrowRight");
  await expect
    .poll(() => viewport.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(0);
  await horizontal.press("Home");
  const rail = (await area
    .locator('[data-scroll-area="horizontal-rail"]')
    .boundingBox())!;
  const thumb = (await horizontal.boundingBox())!;
  await page.mouse.move(
    thumb.x + thumb.width / 2,
    handle.y + handle.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(rail.x + rail.width, handle.y + handle.height / 2);
  await page.mouse.up();
  await expect
    .poll(() =>
      viewport.evaluate(
        (el) => el.scrollWidth - el.clientWidth - el.scrollLeft,
      ),
    )
    .toBeLessThan(1);
  await page.getByRole("button", { name: "Fit content" }).click();
  await expect(horizontal).toHaveCount(0);
  expect((await viewport.boundingBox())!.height).toBe(frame.height);
  await expect(vertical).toBeVisible();
});

test("horizontal scrollbar follows content resizing and releases its reserved space", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-scrollarea--horizontal-overflow&viewMode=story",
  );
  const viewport = page.locator('[data-scroll-area="viewport"]');
  const bar = page.getByRole("scrollbar", { name: "Scroll columns" });
  await expect(bar).toBeVisible();
  await bar.focus();
  await bar.press("ArrowRight");
  await expect
    .poll(() => viewport.evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Fit content" }).click();
  await expect(bar).toHaveCount(0);
  await expect(viewport).toHaveCSS("height", "160px");
  await page.getByRole("button", { name: "Widen content" }).click();
  await expect(bar).toBeVisible();
});

test("standalone scroll area supplies its own style, centered rail, hover, drag and keyboard scrolling", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-scrollarea--short-overflow&viewMode=story",
  );
  const area = page.locator('[data-scroll-area="root"]'),
    viewport = area.locator('[data-scroll-area="viewport"]');
  const rail = area.locator('[data-scroll-area="rail"]'),
    handle = area.locator('[data-scroll-area="handle"]');
  const thumb = area.getByRole("scrollbar", { name: "Scroll entries" });
  await expect(thumb).toBeVisible();
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--space"),
    ),
  ).toBe("");
  const rootBox = (await area.boundingBox())!,
    railBox = (await rail.boundingBox())!,
    thumbBox = (await thumb.boundingBox())!;
  expect(railBox.height).toBeLessThan(rootBox.height);
  expect(railBox.y + railBox.height / 2).toBeCloseTo(
    rootBox.y + rootBox.height / 2,
    0,
  );
  expect(thumbBox.height).toBeLessThan(railBox.height / 2);
  await page.mouse.move(0, 0);
  await expect(handle).toHaveCSS("opacity", "0");
  await area.hover();
  await expect(handle).toHaveCSS("opacity", "0.7");
  await expect
    .poll(() => rail.evaluate((el) => getComputedStyle(el, "::before").opacity))
    .toBe("1");
  await page.mouse.move(
    thumbBox.x + thumbBox.width / 2,
    thumbBox.y + thumbBox.height / 2,
  );
  await expect(handle).toHaveCSS("opacity", "1");
  await page.mouse.down();
  await page.mouse.move(
    thumbBox.x + thumbBox.width / 2,
    railBox.y + railBox.height,
  );
  await page.mouse.up();
  await expect
    .poll(() =>
      viewport.evaluate(
        (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
      ),
    )
    .toBeLessThan(1);
  await thumb.focus();
  await thumb.press("Home");
  await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBe(0);
  await thumb.press("End");
  await expect
    .poll(() =>
      viewport.evaluate(
        (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
      ),
    )
    .toBeLessThan(1);
  await page.goto(
    "/iframe.html?id=layout-scrollarea--no-overflow&viewMode=story",
  );
  await expect(page.getByRole("scrollbar")).toHaveCount(0);
});

test("standalone content growth keeps the rail centered and viewportRef/onScroll work without app services", async ({
  page,
}) => {
  const api: string[] = [];
  page.on("request", (request) => {
    if (/\/cxz\./.test(request.url())) api.push(request.url());
  });
  await page.goto(
    "/iframe.html?id=layout-scrollarea--growing-content&viewMode=story",
  );
  const area = page.locator('[data-scroll-area="root"]'),
    viewport = area.locator('[data-scroll-area="viewport"]'),
    rail = area.locator('[data-scroll-area="rail"]');
  const handle = area.locator('[data-scroll-area="handle"]');
  await expect(area.getByRole("scrollbar")).toBeVisible();
  const initial = (await rail.boundingBox())!.height;
  const add = page.getByRole("button", { name: "Add entries" });
  await add.hover();
  await expect(handle).toHaveCSS("opacity", "0");
  await add.click();
  await expect
    .poll(async () => (await rail.boundingBox())!.height)
    .toBeGreaterThan(initial);
  const outer = (await area.boundingBox())!,
    grown = (await rail.boundingBox())!;
  expect(grown.y + grown.height / 2).toBeCloseTo(outer.y + outer.height / 2, 0);
  await page.getByRole("button", { name: "Scroll to bottom" }).click();
  await expect
    .poll(() =>
      viewport.evaluate(
        (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
      ),
    )
    .toBeLessThan(1);
  await expect
    .poll(() => page.getByLabel("Scroll position").textContent())
    .not.toBe("0");
  expect(api).toEqual([]);
});

test("scroll fades update without invalidating the content subtree", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-scrollarea--short-overflow&viewMode=story",
  );
  const area = page.locator('[data-scroll-area="root"]');
  const viewport = area.locator('[data-scroll-area="viewport"]');
  const top = area.locator('[data-scroll-area="top-fade"]');
  const bottom = area.locator('[data-scroll-area="bottom-fade"]');
  await expect(top).toHaveCSS("opacity", "0");
  await expect(bottom).toHaveCSS("opacity", "1");
  await viewport.evaluate((el) => {
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
  });
  await expect(top).toHaveCSS("opacity", "1");
  await expect(bottom).toHaveCSS("opacity", "1");
  const result = await viewport.evaluate((el) => ({
    inherited: ["top", "bottom"].flatMap((edge) =>
      ["hidden", "opacity", "motion"].map((value) =>
        getComputedStyle(el).getPropertyValue(
          `--ui-scroll-area-${edge}-${value}`,
        ),
      ),
    ),
    top: parseFloat(
      el
        .parentElement!.querySelector<HTMLElement>(
          '[data-scroll-area="top-fade"]',
        )!
        .style.getPropertyValue("--ui-scroll-area-top-hidden"),
    ),
    scroll: el.scrollTop,
  }));
  expect(result.inherited).toEqual(["", "", "", "", "", ""]);
  expect(result.top).toBeCloseTo(result.scroll, 0);
  await area.getByRole("scrollbar").press("End");
  await expect(bottom).toHaveCSS("opacity", "0");
});

for (const policy of ["auto", "contain", "none"]) {
  for (const horizontal of [false, true]) {
    test(`${horizontal ? "horizontal" : "vertical"} rail honors ${policy} at the scroll boundary`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 500, height: 500 });
      await page.goto(
        "/iframe.html?id=layout-scrollarea--outside-both-axes&viewMode=story",
      );
      const area = page.locator('[data-scroll-area="root"]');
      const viewport = area.locator('[data-scroll-area="viewport"]');
      await expect(area.getByRole("scrollbar")).toHaveCount(2);
      await viewport.evaluate((node, policy) => {
        node.style.overscrollBehavior = policy;
        document.body.style.width = "1000px";
        document.body.style.height = "1400px";
        const story = document.getElementById("storybook-root")!;
        Object.assign(story.style, {
          position: "absolute",
          top: "40px",
          left: "40px",
          width: "260px",
        });
        window.scrollTo(0, 0);
      }, policy);
      const thumb = area.getByRole("scrollbar", {
        name: horizontal ? "Scroll columns" : "Scroll entries",
        exact: true,
      });
      await thumb.press("End");
      const nativeBoundary = await viewport.evaluate((node, horizontal) => {
        const wheel = new WheelEvent("wheel", {
          deltaX: horizontal ? 0.25 : 0,
          deltaY: horizontal ? 0 : 0.25,
          bubbles: true,
          cancelable: true,
        });
        node.firstElementChild!.dispatchEvent(wheel);
        const zoom = new WheelEvent("wheel", {
          deltaY: 1,
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        });
        node.dispatchEvent(zoom);
        return {
          prevented: wheel.defaultPrevented,
          zoomPrevented: zoom.defaultPrevented,
        };
      }, horizontal);
      expect(nativeBoundary.prevented).toBe(policy !== "auto");
      expect(nativeBoundary.zoomPrevented).toBe(false);
      const track = area.locator(
        `[data-scroll-area="${horizontal ? "horizontal-rail" : "rail"}"]`,
      );
      const rect = (await track.boundingBox())!;
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      const position = () =>
        page.evaluate(
          (horizontal) => (horizontal ? window.scrollX : window.scrollY),
          horizontal,
        );
      await page.mouse.wheel(horizontal ? 120 : 0, horizontal ? 0 : 120);
      if (policy === "auto") {
        await expect.poll(position).toBeGreaterThan(0);
      } else {
        // Give the compositor time to apply a wheel event to the outer page.
        await page.waitForTimeout(150);
        expect(await position()).toBe(0);
      }
      await expect
        .poll(() =>
          viewport.evaluate((node, horizontal) => {
            const remaining = horizontal
              ? node.scrollWidth - node.clientWidth - node.scrollLeft
              : node.scrollHeight - node.clientHeight - node.scrollTop;
            return Math.abs(remaining);
          }, horizontal),
        )
        .toBeLessThan(1);
    });
  }
}

for (const wheelBehavior of ["native", "instant"] as const) {
  test(`${wheelBehavior} viewport leaves a nested native scroller usable at the outer boundary`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=layout-scrollarea--long-list&viewMode=story&args=wheelBehavior:${wheelBehavior}`,
    );
    const viewport = page.locator('[data-scroll-area="viewport"]');
    await expect(viewport).toBeVisible();
    await viewport.evaluate((node) => {
      node.style.overscrollBehavior = "none";
      const nested = document.createElement("div");
      nested.dataset.nestedScroll = "true";
      Object.assign(nested.style, { height: "100px", overflow: "auto" });
      const body = document.createElement("div");
      Object.assign(body.style, { height: "600px" });
      body.textContent = "Nested scrolling";
      nested.append(body);
      node.firstElementChild!.append(nested);
      node.scrollTop = node.scrollHeight;
    });
    const nested = viewport.locator('[data-nested-scroll="true"]');
    await nested.hover();
    await page.mouse.wheel(0, 80);
    await expect
      .poll(() => nested.evaluate((node) => node.scrollTop))
      .toBeGreaterThan(0);
    const result = await nested.evaluate((node) => {
      const wheel = () =>
        new WheelEvent("wheel", {
          deltaY: 0.25,
          bubbles: true,
          cancelable: true,
        });
      const moving = wheel();
      node.firstElementChild!.dispatchEvent(moving);
      node.scrollTop = node.scrollHeight;
      const boundary = wheel();
      node.firstElementChild!.dispatchEvent(boundary);
      return {
        moving: moving.defaultPrevented,
        boundary: boundary.defaultPrevented,
      };
    });
    expect(result).toEqual({ moving: false, boundary: true });
  });
}

test("fractional native bottom offsets hide the final fade", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-scrollarea--long-list&viewMode=story",
  );
  const viewport = page.locator('[data-scroll-area="viewport"]');
  await expect(viewport).toBeVisible();
  await viewport.evaluate((node) => {
    document.body.style.zoom = "0.9";
    node.scrollTop = node.scrollHeight;
  });
  await expect(page.locator('[data-scroll-area="bottom-fade"]')).toHaveCSS(
    "opacity",
    "0",
  );
});

test("instant wheel handles the first event inside the viewport and keeps a continuing tail settled", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-scrollarea--instant-wheel&viewMode=story&args=wheelSmoothing:0",
  );
  const viewport = page.locator('[data-scroll-area="viewport"]');
  await expect(page.getByRole("scrollbar")).toHaveCount(2);
  await viewport.evaluate((node) => {
    node.style.overscrollBehavior = "none";
    node.addEventListener(
      "wheel",
      (event) => {
        node.dataset.firstWheelConsumed = String(event.defaultPrevented);
      },
      { once: true },
    );
  });
  await viewport.hover();
  await page.mouse.wheel(0, 32);
  await expect(viewport).toHaveAttribute("data-first-wheel-consumed", "true");
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBe(32);
  const modes = await viewport.evaluate((node) => {
    const fire = (init: WheelEventInit) => {
      const event = new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        ...init,
      });
      node.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const start = node.scrollTop;
    const lineSize = parseFloat(getComputedStyle(node).lineHeight) || 16;
    const line = fire({ deltaY: 2, deltaMode: 1 });
    const lineTop = node.scrollTop;
    const maxLeft = node.scrollWidth - node.clientWidth;
    const page = fire({ deltaX: 1, deltaMode: 2 });
    const pageLeft = node.scrollLeft;
    node.scrollLeft = 0;
    const shift = fire({ deltaY: 5, shiftKey: true });
    const shifted = { left: node.scrollLeft, top: node.scrollTop };
    const ctrl = fire({ deltaY: 4, ctrlKey: true });
    const noncancelable = fire({ deltaY: 4, cancelable: false });
    return {
      start,
      lineSize,
      line,
      lineTop,
      maxLeft,
      page,
      pageLeft,
      width: node.clientWidth,
      shift,
      shifted,
      ctrl,
      noncancelable,
      finalTop: node.scrollTop,
    };
  });
  expect(modes.line).toBe(true);
  expect(modes.lineTop).toBeCloseTo(modes.start + 2 * modes.lineSize, 0);
  expect(modes.page).toBe(true);
  expect(modes.pageLeft).toBe(Math.min(modes.width, modes.maxLeft));
  expect(modes.shift).toBe(true);
  expect(modes.shifted).toEqual({ left: 5, top: modes.lineTop });
  expect(modes.ctrl).toBe(false);
  expect(modes.noncancelable).toBe(false);
  expect(modes.finalTop).toBe(modes.lineTop);
  const fractional = await viewport.evaluate((node) => {
    node.scrollTop = 0;
    const consumed: boolean[] = [];
    for (let n = 0; n < 16; n++) {
      const event = new WheelEvent("wheel", {
        deltaY: 0.125,
        bubbles: true,
        cancelable: true,
      });
      node.dispatchEvent(event);
      consumed.push(event.defaultPrevented);
    }
    return { top: node.scrollTop, consumed };
  });
  expect(fractional.top).toBe(2);
  expect(fractional.consumed.every(Boolean)).toBe(true);
  for (const delta of [120, 120, 120, 1, 0.5, 0.25, 0.125, 0.125])
    await page.mouse.wheel(0, delta);
  const samples = await viewport.evaluate(async (node) => {
    const top: number[] = [];
    for (let frame = 0; frame < 16; frame++) {
      await new Promise(requestAnimationFrame);
      top.push(node.scrollTop);
    }
    return { top, max: node.scrollHeight - node.clientHeight };
  });
  expect(Math.max(...samples.top) - Math.min(...samples.top)).toBe(0);
  expect(samples.top[0]).toBe(samples.max);
});

test("instant smoothing merges wheel input into one monotonic target", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-scrollarea--instant-wheel&viewMode=story",
  );
  const viewport = page.locator('[data-scroll-area="viewport"]');
  await expect(page.getByRole("scrollbar")).toHaveCount(2);
  const result = await viewport.evaluate(async (node) => {
    node.style.overscrollBehavior = "none";
    const fire = () => {
      const wheel = new WheelEvent("wheel", {
        deltaY: 80,
        bubbles: true,
        cancelable: true,
      });
      node.dispatchEvent(wheel);
      return wheel.defaultPrevented;
    };
    const first = fire();
    const immediate = node.scrollTop;
    const samples: number[] = [];
    let second = false;
    for (let frame = 0; frame < 42; frame++) {
      await new Promise(requestAnimationFrame);
      if (frame === 2) second = fire();
      samples.push(node.scrollTop);
    }
    return { first, second, immediate, samples };
  });
  expect(result.first).toBe(true);
  expect(result.second).toBe(true);
  expect(result.immediate).toBe(0);
  expect(result.samples.some((value) => value > 0 && value < 80)).toBe(true);
  expect(result.samples.at(-1)).toBe(160);
  for (let index = 1; index < result.samples.length; index++) {
    expect(result.samples[index]).toBeGreaterThanOrEqual(
      result.samples[index - 1],
    );
    expect(result.samples[index]).toBeLessThanOrEqual(160);
  }
});

test("smoothed wheel settles at a clamped edge, reverses and yields to external input", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-scrollarea--instant-wheel&viewMode=story",
  );
  const viewport = page.locator('[data-scroll-area="viewport"]');
  await expect(page.getByRole("scrollbar")).toHaveCount(2);
  const boundary = await viewport.evaluate(async (node) => {
    node.style.overscrollBehavior = "none";
    node.scrollTop = node.scrollHeight - node.clientHeight - 60;
    const fire = (deltaY: number) =>
      node.dispatchEvent(
        new WheelEvent("wheel", { deltaY, bubbles: true, cancelable: true }),
      );
    fire(10000);
    const samples: number[] = [];
    for (let frame = 0; frame < 42; frame++) {
      await new Promise(requestAnimationFrame);
      if (frame % 3 === 0) fire(10000);
      samples.push(node.scrollTop);
    }
    const max = node.scrollHeight - node.clientHeight;
    fire(-24);
    const reverse: number[] = [];
    for (let frame = 0; frame < 38; frame++) {
      await new Promise(requestAnimationFrame);
      reverse.push(node.scrollTop);
    }
    return { samples, max, reverse };
  });
  expect(boundary.samples.at(-1)).toBe(boundary.max);
  for (let index = 1; index < boundary.samples.length; index++)
    expect(boundary.samples[index]).toBeGreaterThanOrEqual(
      boundary.samples[index - 1],
    );
  expect(boundary.reverse.some((top) => top < boundary.max)).toBe(true);
  expect(boundary.reverse.at(-1)).toBe(boundary.max - 24);
  for (let index = 1; index < boundary.reverse.length; index++)
    expect(boundary.reverse[index]).toBeLessThanOrEqual(
      boundary.reverse[index - 1],
    );
  const interrupted = await viewport.evaluate(async (node) => {
    node.scrollTop = 0;
    const fire = () =>
      node.dispatchEvent(
        new WheelEvent("wheel", {
          deltaY: 120,
          bubbles: true,
          cancelable: true,
        }),
      );
    fire();
    node.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
    for (let frame = 0; frame < 20; frame++)
      await new Promise(requestAnimationFrame);
    const keyboard = node.scrollTop;
    fire();
    await new Promise(requestAnimationFrame);
    node.scrollTop = 100;
    const samples: number[] = [];
    for (let frame = 0; frame < 30; frame++) {
      await new Promise(requestAnimationFrame);
      samples.push(node.scrollTop);
    }
    return { keyboard, samples };
  });
  expect(interrupted.keyboard).toBe(0);
  expect(interrupted.samples.every((top) => top === 100)).toBe(true);
});

test("reduced motion disables instant-wheel easing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    "/iframe.html?id=layout-scrollarea--instant-wheel&viewMode=story",
  );
  const viewport = page.locator('[data-scroll-area="viewport"]');
  await expect(page.getByRole("scrollbar")).toHaveCount(2);
  const immediate = await viewport.evaluate((node) => {
    const wheel = new WheelEvent("wheel", {
      deltaY: 80,
      bubbles: true,
      cancelable: true,
    });
    node.dispatchEvent(wheel);
    return { top: node.scrollTop, consumed: wheel.defaultPrevented };
  });
  expect(immediate).toEqual({ top: 80, consumed: true });
});
