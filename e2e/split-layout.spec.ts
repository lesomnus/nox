import { expect, test, type Locator, type Page } from "@playwright/test";

const split = (page: Page, id: string) =>
  page.locator(`[data-split-id="${id}"]`);
const junction = (page: Page) =>
  page.getByRole("button", { name: "Resize both axes", exact: true });
async function center(element: Locator) {
  const r = (await element.boundingBox())!;
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}
async function open(page: Page, story: string) {
  await page.goto(
    `/iframe.html?id=layout-splitlayout--${story}&viewMode=story`,
  );
  await expect(junction(page).first()).toBeVisible();
}

for (const story of ["nested", "transposed"]) {
  test(`${story}: connected T junction moves both axes throughout one captured drag`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await open(page, story);
    for (const name of story === "nested"
      ? ["Left", "Top right", "Bottom right"]
      : ["Top", "Bottom left", "Bottom right"])
      await expect(page.getByText(name, { exact: true })).toBeInViewport();
    await expect(junction(page)).toHaveCount(1);
    const before = await center(junction(page));
    await page.mouse.move(before.x, before.y);
    await page.mouse.down();
    await page.mouse.move(before.x + 45, before.y + 35, { steps: 6 });
    await expect(
      page.locator('[data-split-id][data-dragging="true"]'),
    ).toHaveCount(2);
    let after = await center(junction(page));
    expect(after.x - before.x).toBeCloseTo(45, 0);
    expect(after.y - before.y).toBeCloseTo(35, 0);
    await page.mouse.move(before.x + 65, before.y + 55, { steps: 4 });
    after = await center(junction(page));
    expect(after.x - before.x).toBeCloseTo(65, 0);
    expect(after.y - before.y).toBeCloseTo(55, 0);
    await page.mouse.up();
    await expect(page.locator("[data-dragging]")).toHaveCount(0);

    const outer = await center(split(page, "outer")),
      inner = await center(split(page, "inner"));
    expect(
      Math.abs(after.x - (story === "nested" ? outer.x : inner.x)),
    ).toBeLessThan(0.5);
    expect(
      Math.abs(after.y - (story === "nested" ? inner.y : outer.y)),
    ).toBeLessThan(0.5);
    await junction(page).dblclick();
    await expect(split(page, "outer")).toHaveAttribute("aria-valuenow", "50");
    await expect(split(page, "inner")).toHaveAttribute("aria-valuenow", "50");
    await junction(page).evaluate((node) => (node as HTMLElement).blur());
    await page.mouse.move(0, 0);
    await page
      .locator("[data-split-layout]")
      .screenshot({ path: `/tmp/nox-split-${story}.png` });
    expect(errors).toEqual([]);
  });
}

test("a four-way junction preserves all branches at limits and on reversal", async ({
  page,
}) => {
  await open(page, "crossing");
  await expect(junction(page)).toHaveCount(1);
  const start = await center(junction(page));
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 1000, start.y + 1000, { steps: 6 });
  for (const id of ["outer", "left", "right"])
    await expect(split(page, id)).toHaveAttribute("aria-valuenow", "85");
  await expect(
    page.locator('[data-split-id][data-dragging="true"]'),
  ).toHaveCount(3);
  expect(
    Math.abs(
      (await center(split(page, "left"))).y -
        (await center(split(page, "right"))).y,
    ),
  ).toBeLessThan(0.25);
  await page.mouse.move(start.x + 20, start.y - 25, { steps: 6 });
  const end = await center(junction(page));
  expect(end.x - start.x).toBeCloseTo(20, 0);
  expect(end.y - start.y).toBeCloseTo(-25, 0);
  await page.mouse.up();
  expect(
    Math.abs(
      (await center(split(page, "left"))).y -
        (await center(split(page, "right"))).y,
    ),
  ).toBeLessThan(0.25);
  await junction(page).dblclick();
  await junction(page).evaluate((node) => (node as HTMLElement).blur());
  await page.mouse.move(0, 0);
  await page
    .locator("[data-split-layout]")
    .screenshot({ path: "/tmp/nox-split-crossing.png" });
});

test("offset junctions affect only the connected splits", async ({ page }) => {
  await open(page, "offset-junctions");
  await expect(junction(page)).toHaveCount(2);
  const positions = await Promise.all((await junction(page).all()).map(center));
  const top = positions.sort((a, b) => a.y - b.y)[0];
  await page.mouse.move(top.x, top.y);
  await page.mouse.down();
  await page.mouse.move(top.x + 30, top.y + 25, { steps: 6 });
  await page.mouse.up();
  await expect(split(page, "right")).toHaveAttribute("aria-valuenow", "65");
  await expect(split(page, "left")).not.toHaveAttribute("aria-valuenow", "35");
  await expect(split(page, "outer")).not.toHaveAttribute("aria-valuenow", "50");
  await expect(junction(page)).toHaveCount(2);
});

test("crossing an unrelated junction does not drop an active drag", async ({
  page,
}) => {
  await open(page, "offset-junctions");
  const left = await center(split(page, "left"));
  const right = await center(split(page, "right"));
  const x = (await center(split(page, "outer"))).x;
  await page.mouse.move(x, left.y);
  await page.mouse.down();
  await page.mouse.move(x + 20, right.y);
  await expect(junction(page)).toHaveCount(1);
  await page.mouse.move(x + 50, right.y + 40);
  await page.mouse.up();
  expect((await center(split(page, "outer"))).x - x).toBeCloseTo(50, 0);
  expect((await center(split(page, "left"))).y - right.y).toBeCloseTo(40, 0);
  await expect(split(page, "right")).toHaveAttribute("aria-valuenow", "65");
  await expect(junction(page)).toHaveCount(2);
});

test("junction keys, cancellation and container/gutter resizing keep working", async ({
  page,
}) => {
  await open(page, "nested");
  const joint = junction(page);
  await joint.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Shift+ArrowDown");
  await expect(split(page, "outer")).toHaveAttribute("aria-valuenow", "52");
  await expect(split(page, "inner")).toHaveAttribute("aria-valuenow", "60");
  await page.keyboard.press("End");
  await expect(split(page, "outer")).toHaveAttribute("aria-valuenow", "85");
  await expect(split(page, "inner")).toHaveAttribute("aria-valuenow", "85");
  await page.keyboard.press("Enter");
  await expect(split(page, "outer")).toHaveAttribute("aria-valuenow", "50");
  await expect(split(page, "inner")).toHaveAttribute("aria-valuenow", "50");

  await page.setViewportSize({ width: 440, height: 650 });
  await page.addStyleTag({
    content: ":root { --ui-resize-handle-size: 9px; }",
  });
  await expect
    .poll(async () =>
      Math.abs(
        (await center(joint)).x - (await center(split(page, "outer"))).x,
      ),
    )
    .toBeLessThan(0.5);
  await expect
    .poll(async () =>
      Math.abs(
        (await center(joint)).y - (await center(split(page, "inner"))).y,
      ),
    )
    .toBeLessThan(0.5);
  const start = await center(joint);
  await joint.evaluate((node) =>
    node.addEventListener(
      "pointerdown",
      (event) =>
        node.setAttribute(
          "data-pointer",
          String((event as PointerEvent).pointerId),
        ),
      { once: true },
    ),
  );
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  const pointerId = Number(await joint.getAttribute("data-pointer"));
  await joint.dispatchEvent("pointercancel", { pointerId });
  await page.mouse.move(start.x + 40, start.y + 30);
  await page.mouse.up();
  await expect(split(page, "outer")).toHaveAttribute("aria-valuenow", "50");
  await expect(split(page, "inner")).toHaveAttribute("aria-valuenow", "50");
  await expect(page.locator("[data-dragging]")).toHaveCount(0);
});

test("an ordinary separator drag preserves the grab offset and only its own axis", async ({
  page,
}) => {
  await open(page, "nested");
  const separator = split(page, "outer");
  const box = (await separator.boundingBox())!;
  const start = { x: box.x + 0.5, y: box.y + 15 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x, start.y);
  await expect(separator).toHaveAttribute("aria-valuenow", "50");
  await page.mouse.move(start.x + 40, start.y + 50, { steps: 5 });
  await page.mouse.up();
  expect((await center(separator)).x - (box.x + box.width / 2)).toBeCloseTo(
    40,
    0,
  );
  await expect(split(page, "inner")).toHaveAttribute("aria-valuenow", "50");
  await separator.press("Home");
  await expect(separator).toHaveAttribute("aria-valuenow", "15");
});

test("hover thickness is the same for both orientations and follows one token", async ({
  page,
}) => {
  await open(page, "nested");
  const vertical = split(page, "outer"),
    horizontal = split(page, "inner");
  const v = (await vertical.boundingBox())!,
    h = (await horizontal.boundingBox())!;
  const thickness = (target: Locator, dimension: "width" | "height") =>
    target.evaluate(
      (node, dimension) =>
        parseFloat(getComputedStyle(node, "::before")[dimension]),
      dimension,
    );
  await page.mouse.move(v.x + v.width / 2, v.y + 20);
  const verticalSize = await thickness(vertical, "width");
  await page.mouse.move(h.x + h.width - 20, h.y + h.height / 2);
  expect(await thickness(horizontal, "height")).toBe(verticalSize);
  await page.addStyleTag({
    content: ":root { --ui-split-line-hover-size: 3px; }",
  });
  await expect.poll(() => thickness(horizontal, "height")).toBe(3);
  await page.mouse.move(v.x + v.width / 2, v.y + 20);
  await expect.poll(() => thickness(vertical, "width")).toBe(3);
});

test("a joined divider hovers and drags as one continuous line", async ({
  page,
}) => {
  await open(page, "crossing");
  const left = split(page, "left"),
    right = split(page, "right");
  const start = await center(left),
    other = await center(right);
  await page.mouse.move(start.x, start.y);
  const color = await left.evaluate(
    (node) => getComputedStyle(node, "::before").backgroundColor,
  );
  await expect
    .poll(() =>
      right.evaluate(
        (node) => getComputedStyle(node, "::before").backgroundColor,
      ),
    )
    .toBe(color);
  await expect
    .poll(() =>
      junction(page).evaluate(
        (node) => getComputedStyle(node, "::after").backgroundColor,
      ),
    )
    .toBe(color);
  await expect
    .poll(() =>
      junction(page).evaluate(
        (node) => getComputedStyle(node, "::after").height,
      ),
    )
    .toBe("5px");
  await page
    .locator("[data-split-layout]")
    .screenshot({ path: "/tmp/nox-split-linked-hover.png" });
  await page.mouse.down();
  await page.mouse.move(start.x, start.y + 40, { steps: 5 });
  await page.mouse.up();
  expect((await center(left)).y - start.y).toBeCloseTo(40, 0);
  expect((await center(right)).y - other.y).toBeCloseTo(40, 0);
  await expect(split(page, "outer")).toHaveAttribute("aria-valuenow", "50");
});

test("snapping holds through jitter and joins the segments after release", async ({
  page,
}) => {
  await open(page, "offset-junctions");
  const left = split(page, "left"),
    right = split(page, "right");
  const start = await center(left),
    target = await center(right);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x, target.y - 6, { steps: 6 });
  expect(Math.abs((await center(left)).y - target.y)).toBeLessThan(0.5);
  await page.mouse.move(start.x, target.y + 12);
  expect(Math.abs((await center(left)).y - target.y)).toBeLessThan(0.5);
  await page.mouse.up();
  await expect(junction(page)).toHaveCount(1);
  const joined = await center(right);
  await page.mouse.move(joined.x, joined.y);
  await page.mouse.down();
  await page.mouse.move(joined.x, joined.y + 30, { steps: 4 });
  await page.mouse.up();
  expect((await center(left)).y - target.y).toBeCloseTo(30, 0);
  expect((await center(right)).y - target.y).toBeCloseTo(30, 0);
});

test("double-click arms a separate drag without immediately snapping back", async ({
  page,
}) => {
  await open(page, "crossing");
  const left = split(page, "left"),
    right = split(page, "right");
  const before = await center(left),
    other = await center(right);
  await left.dblclick();
  await expect(left).toHaveAttribute("data-detached", "true");
  await page.mouse.move(before.x, before.y);
  await page.mouse.down();
  await page.mouse.move(before.x, before.y + 7, { steps: 3 });
  await page.mouse.up();
  expect((await center(left)).y - before.y).toBeCloseTo(7, 0);
  expect((await center(right)).y - other.y).toBeCloseTo(0, 0);
  await expect(junction(page)).toHaveCount(2);
});

test("holding the second press detaches one segment without a reset on release", async ({
  page,
}) => {
  await open(page, "crossing");
  const left = split(page, "left"),
    right = split(page, "right");
  const before = await center(left),
    other = await center(right);
  await left.click();
  await page.mouse.down({ clickCount: 2 });
  await page.mouse.move(before.x, before.y + 35, { steps: 5 });
  await page.mouse.up({ clickCount: 2 });
  expect((await center(left)).y - before.y).toBeCloseTo(35, 0);
  expect((await center(right)).y - other.y).toBeCloseTo(0, 0);
});

test("canceling a snap restores the original separate positions", async ({
  page,
}) => {
  await open(page, "offset-junctions");
  const left = split(page, "left"),
    right = split(page, "right");
  const before = await center(left),
    other = await center(right);
  await left.evaluate((node) =>
    node.addEventListener(
      "pointerdown",
      (event) =>
        node.setAttribute(
          "data-pointer",
          String((event as PointerEvent).pointerId),
        ),
      { once: true },
    ),
  );
  await page.mouse.move(before.x, before.y);
  await page.mouse.down();
  await page.mouse.move(before.x, other.y - 5);
  expect(Math.abs((await center(left)).y - other.y)).toBeLessThan(0.5);
  await left.dispatchEvent("pointercancel", {
    pointerId: Number(await left.getAttribute("data-pointer")),
  });
  await page.mouse.up();
  expect((await center(left)).y - before.y).toBeCloseTo(0, 0);
  expect((await center(right)).y - other.y).toBeCloseTo(0, 0);
  await expect(junction(page)).toHaveCount(2);
});

test("vertical opposing segments also snap and join across a horizontal gutter", async ({
  page,
}) => {
  await open(page, "offset-junctions");
  await page.evaluate(() => {
    const row = (id: string, ratio: number) => ({
      kind: "split",
      id,
      axis: "horizontal",
      ratio,
      first: { kind: "pane", id: `${id} a` },
      second: { kind: "pane", id: `${id} b` },
    });
    const channel = (
      window as unknown as {
        __STORYBOOK_ADDONS_CHANNEL__: {
          emit: (name: string, data: unknown) => void;
        };
      }
    ).__STORYBOOK_ADDONS_CHANNEL__;
    channel.emit("updateStoryArgs", {
      storyId: "layout-splitlayout--offset-junctions",
      updatedArgs: {
        node: {
          kind: "split",
          id: "outer",
          axis: "vertical",
          ratio: 0.5,
          first: row("top", 0.35),
          second: row("bottom", 0.65),
        },
      },
    });
  });
  await expect(split(page, "outer")).toHaveAttribute(
    "aria-orientation",
    "horizontal",
  );
  const top = split(page, "top"),
    bottom = split(page, "bottom");
  const start = await center(top),
    target = await center(bottom);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(target.x - 5, start.y, { steps: 6 });
  expect(Math.abs((await center(top)).x - target.x)).toBeLessThan(0.5);
  await page.mouse.up();
  await expect(junction(page)).toHaveCount(1);
  const joined = await center(bottom);
  await page.mouse.move(joined.x, joined.y);
  await page.mouse.down();
  await page.mouse.move(joined.x + 25, joined.y, { steps: 4 });
  await page.mouse.up();
  expect((await center(top)).x - target.x).toBeCloseTo(25, 0);
  expect((await center(bottom)).x - target.x).toBeCloseTo(25, 0);
});

for (const id of ["outer", "inner"]) {
  test(`double-click drag of standalone ${id} stays where it is released`, async ({
    page,
  }) => {
    await open(page, "nested");
    const handle = split(page, id);
    const box = (await handle.boundingBox())!;
    const vertical = id === "outer";
    const start = {
      x: box.x + box.width / 2,
      y: vertical ? box.y + box.height / 4 : box.y + box.height / 2,
    };
    await page.mouse.click(start.x, start.y);
    await page.mouse.down({ clickCount: 2 });
    await page.mouse.move(
      start.x + (vertical ? 45 : 0),
      start.y + (vertical ? 0 : 45),
      { steps: 5 },
    );
    const held = await center(handle);
    await page.mouse.up({ clickCount: 2 });
    const released = await center(handle);
    expect(released.x).toBeCloseTo(held.x, 0);
    expect(released.y).toBeCloseTo(held.y, 0);
    expect(vertical ? released.x - start.x : released.y - start.y).toBeCloseTo(
      45,
      0,
    );
  });
}

for (const story of ["crossing", "transposed-crossing"]) {
  for (const second of [false, true]) {
    for (const heldSecondPress of [false, true]) {
      test(`${story}: detach ${second ? "second" : "first"} half with ${heldSecondPress ? "held second press" : "double click then drag"}`, async ({
        page,
      }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await open(page, story);
        const vertical = story === "crossing";
        const handle = split(page, "outer");
        const box = (await handle.boundingBox())!;
        const start = {
          x: box.x + box.width * (vertical ? 0.5 : second ? 0.75 : 0.25),
          y: box.y + box.height * (vertical ? (second ? 0.75 : 0.25) : 0.5),
        };
        const pane = (name: string) => page.getByText(name, { exact: true });
        const names = ["Top left", "Top right", "Bottom left", "Bottom right"];
        const before = await Promise.all(
          names.map((name) => pane(name).boundingBox()),
        );
        const position = { x: start.x - box.x, y: start.y - box.y };
        if (heldSecondPress) {
          await handle.click({ position });
          await page.mouse.down({ clickCount: 2 });
        } else {
          await handle.dblclick({ position });
          await page.mouse.down();
        }
        await page.mouse.move(
          start.x + (vertical ? 35 : 0),
          start.y + (vertical ? 0 : 35),
          { steps: 5 },
        );
        const held = await Promise.all(
          names.map((name) => pane(name).boundingBox()),
        );
        await page.mouse.up(heldSecondPress ? { clickCount: 2 } : {});
        const after = await Promise.all(
          names.map((name) => pane(name).boundingBox()),
        );
        for (let i = 0; i < names.length; i++) {
          expect(await pane(names[i]).count()).toBe(1);
          for (const field of ["x", "y", "width", "height"] as const)
            expect(after[i]![field]).toBeCloseTo(held[i]![field], 0);
          const moves = vertical ? i >= 2 === second : (i % 2 === 1) === second;
          const dimension = vertical ? "width" : "height";
          const negativeSide = vertical ? i % 2 === 0 : i < 2;
          expect(after[i]![dimension] - before[i]![dimension]).toBeCloseTo(
            moves ? (negativeSide ? 35 : -35) : 0,
            0,
          );
        }
        await expect(junction(page)).toHaveCount(2);
        expect(errors).toEqual([]);
        if (vertical && second && heldSecondPress)
          await page
            .locator("[data-split-layout]")
            .screenshot({ path: "/tmp/nox-split-vertical-detached.png" });
      });
    }
  }
}

test("canceling a continuous-boundary detachment restores the original tree", async ({
  page,
}) => {
  await open(page, "crossing");
  const root = page.locator("[data-split-layout]");
  await root.evaluate((node) =>
    node.addEventListener("pointerdown", (event) =>
      node.setAttribute(
        "data-pointer",
        String((event as PointerEvent).pointerId),
      ),
    ),
  );
  const handle = split(page, "outer");
  const box = (await handle.boundingBox())!;
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 4 };
  await handle.click({ position: { x: box.width / 2, y: box.height / 4 } });
  await page.mouse.down({ clickCount: 2 });
  await page.mouse.move(start.x + 35, start.y, { steps: 3 });
  await expect(junction(page)).toHaveCount(2);
  await root.dispatchEvent("pointercancel", {
    pointerId: Number(await root.getAttribute("data-pointer")),
  });
  await page.mouse.up({ clickCount: 2 });
  for (const id of ["outer", "left", "right"])
    await expect(split(page, id)).toHaveAttribute("aria-valuenow", "50");
  await expect(junction(page)).toHaveCount(1);
  await expect(page.locator("[data-dragging]")).toHaveCount(0);
  await page.waitForTimeout(550);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 20, start.y, { steps: 3 });
  await page.mouse.up();
  expect((await center(split(page, "outer"))).x - start.x).toBeCloseTo(20, 0);
  await expect(split(page, "left")).toHaveAttribute("aria-valuenow", "50");
  await expect(split(page, "right")).toHaveAttribute("aria-valuenow", "50");
});

test("standalone double-click still equalizes without responding to pane double-clicks", async ({
  page,
}) => {
  await open(page, "nested");
  const outer = split(page, "outer");
  await outer.press("Home");
  await page.getByText("Left", { exact: true }).dblclick();
  await expect(outer).toHaveAttribute("aria-valuenow", "15");
  const box = (await outer.boundingBox())!;
  await outer.dblclick({ position: { x: box.width / 2, y: box.height / 4 } });
  await expect(outer).toHaveAttribute("aria-valuenow", "50");
});

for (const story of ["nested", "crossing", "transposed-crossing"]) {
  test(`${story}: junction highlight follows pointer after a joint drag without blurring it`, async ({
    page,
  }) => {
    await open(page, story);
    const joint = junction(page);
    const start = await center(joint);
    const baseSize = await joint.evaluate((node) =>
      parseFloat(
        getComputedStyle(node).getPropertyValue("--ui-split-line-size"),
      ),
    );
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 30, start.y + 25, { steps: 4 });
    await page.mouse.up();
    await expect(joint).toBeFocused();
    await expect(joint).toHaveAttribute("data-highlight-vertical", "true");
    await expect(joint).toHaveAttribute("data-highlight-horizontal", "true");
    await page.mouse.move(30, 30);
    await expect(
      page.locator(
        "[data-highlighted], [data-highlight-vertical], [data-highlight-horizontal], [data-dragging]",
      ),
    ).toHaveCount(0);
    await expect
      .poll(() =>
        joint.evaluate((node) =>
          parseFloat(getComputedStyle(node, "::before").width),
        ),
      )
      .toBe(baseSize);
    const sizes = await page.locator("[data-split-id]").evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node, "::before");
        return parseFloat(
          (node as HTMLElement).dataset.axis === "horizontal"
            ? style.width
            : style.height,
        );
      }),
    );
    expect(sizes.every((size) => size === baseSize)).toBe(true);
    await joint.hover();
    await expect(joint).toHaveAttribute("data-highlight-vertical", "true");
    await expect(joint).toHaveAttribute("data-highlight-horizontal", "true");
    await page.mouse.move(30, 30);
    await expect(
      page.locator(
        "[data-highlighted], [data-highlight-vertical], [data-highlight-horizontal]",
      ),
    ).toHaveCount(0);
  });
}

test("releasing a clamped joint drag outside the layout does not preserve a hover", async ({
  page,
}) => {
  await open(page, "crossing");
  const start = await center(junction(page));
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(1000, 650, { steps: 4 });
  await page.mouse.up();
  await expect(
    page.locator(
      "[data-highlighted], [data-highlight-vertical], [data-highlight-horizontal], [data-dragging]",
    ),
  ).toHaveCount(0);
});

test("keyboard focus still highlights a junction and clears when tabbing away", async ({
  page,
}) => {
  await open(page, "crossing");
  await page.keyboard.press("Tab");
  for (
    let i = 0;
    i < 4 &&
    !(await junction(page).evaluate((node) => node === document.activeElement));
    i++
  )
    await page.keyboard.press("Tab");
  await expect(junction(page)).toBeFocused();
  await expect(junction(page)).toHaveAttribute(
    "data-highlight-vertical",
    "true",
  );
  await expect(junction(page)).toHaveAttribute(
    "data-highlight-horizontal",
    "true",
  );
  await page.keyboard.press("ArrowRight");
  await expect(split(page, "outer")).toHaveAttribute("aria-valuenow", "52");
  const start = await center(junction(page));
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 25, start.y + 20, { steps: 3 });
  await page.mouse.up();
  await page.mouse.move(30, 30);
  await expect(
    page.locator(
      "[data-highlighted], [data-highlight-vertical], [data-highlight-horizontal]",
    ),
  ).toHaveCount(0);
  await page.keyboard.press("ArrowLeft");
  await expect(junction(page)).toHaveAttribute(
    "data-highlight-vertical",
    "true",
  );
  await expect(junction(page)).toHaveAttribute(
    "data-highlight-horizontal",
    "true",
  );
  await page.keyboard.press("Tab");
  await expect(
    page.locator(
      "[data-highlighted], [data-highlight-vertical], [data-highlight-horizontal]",
    ),
  ).toHaveCount(0);
});
