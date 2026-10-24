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
