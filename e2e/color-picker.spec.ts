import { expect, test, type Locator } from "@playwright/test";
const story = (name: string) =>
  `/iframe.html?id=components-colorpicker--${name}&viewMode=story`;
async function paste(target: Locator, text: string) {
  await target.evaluate((node, text) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", text);
    node.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData,
        bubbles: true,
        cancelable: true,
      }),
    );
  }, text);
}

test("bare picker has two vertical rails on the right without visible labels or a swatch", async ({
  page,
}) => {
  await page.goto(story("default"));
  const root = page.getByRole("group", { name: "Color", exact: true });
  const plane = page.locator('[data-color-picker="plane"]');
  const hue = page.getByRole("slider", { name: "Hue", exact: true });
  const alpha = page.getByRole("slider", { name: "Opacity", exact: true });
  await expect(root.getByText("Hue", { exact: true })).toHaveCount(0);
  await expect(root.getByText("Opacity", { exact: true })).toHaveCount(0);
  await expect(root.locator('[data-color-picker="preview"]')).toHaveCount(0);
  await expect(page.getByLabel("RGB value")).toHaveCount(0);
  // Exercise endpoint updates with the synchronous caller-owned value example.
  await page.goto(story("preview"));
  const box = (await plane.boundingBox())!;
  let previousRight = box.x + box.width;
  for (const rail of [hue, alpha]) {
    await expect(rail).toHaveAttribute("aria-orientation", "vertical");
    const track = (await rail.boundingBox())!;
    expect(track.x).toBeGreaterThan(previousRight);
    expect(track.y).toBeCloseTo(box.y, 0);
    expect(track.height).toBeCloseTo(box.height, 0);
    expect(track.width).toBeLessThan(track.height);
    previousRight = track.x + track.width;
    const max = (await rail.getAttribute("max"))!;
    await page.mouse.click(track.x + track.width / 2, track.y + 1);
    await expect(rail).toHaveValue(max);
    await page.mouse.click(
      track.x + track.width / 2,
      track.y + track.height - 1,
    );
    await expect(rail).toHaveValue("0");
    await rail.press("ArrowUp");
    expect(Number(await rail.inputValue())).toBeGreaterThan(0);
    await rail.press("ArrowDown");
    await expect(rail).toHaveValue("0");
  }
});

test("gradient clicks select a shade with no numeric channel inputs", async ({
  page,
}) => {
  await page.goto(story("preview"));
  await expect(page.getByRole("spinbutton")).toHaveCount(0);
  const hue = page.getByRole("slider", { name: "Hue", exact: true });
  await hue.focus();
  await hue.press("Home");
  const plane = page.locator('[data-color-picker="plane"]');
  const box = (await plane.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByLabel("RGB value")).toHaveText("rgb(128 64 64 / 1)");
  await expect(
    page.getByRole("slider", { name: "Saturation", exact: true }),
  ).toHaveValue("0.5");
  await expect(
    page.getByRole("slider", { name: "Brightness", exact: true }),
  ).toHaveValue("0.5");
});

test("captured dragging clamps at the edges and hue survives white and black", async ({
  page,
}) => {
  await page.goto(story("preview"));
  const plane = page.locator('[data-color-picker="plane"]');
  const box = (await plane.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 30, box.y + box.height + 30);
  await page.mouse.up();
  await expect(page.getByLabel("RGB value")).toHaveText("rgb(0 0 0 / 1)");
  const hue = page.getByRole("slider", { name: "Hue", exact: true });
  await hue.focus();
  await hue.press("Home");
  // Native range PageUp advances by 10% of its range: 5 pages reach cyan.
  for (let i = 0; i < 5; i++) await hue.press("PageUp");
  await expect(hue).toHaveValue("180");
  await plane.focus();
  await plane.press("Home");
  await expect(page.getByLabel("RGB value")).toHaveText("rgb(255 255 255 / 1)");
  await plane.press("Shift+ArrowRight");
  await expect(page.getByLabel("RGB value")).toHaveText("rgb(230 255 255 / 1)");
});

test("opacity has a checkerboard rail and changes alpha without changing RGB", async ({
  page,
}) => {
  await page.goto(story("preview"));
  const alpha = page.getByRole("slider", { name: "Opacity", exact: true });
  const box = (await alpha.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(alpha).toHaveValue("0.5");
  await expect(page.getByLabel("RGB value")).toHaveText(
    "rgb(217 255 48 / 0.5)",
  );
  await expect(alpha).toHaveCSS("background-image", /repeating-conic-gradient/);
  await alpha.press("Home");
  await expect(page.getByLabel("RGB value")).toHaveText("rgb(217 255 48 / 0)");
  await alpha.press("End");
  await expect(page.getByLabel("RGB value")).toHaveText("rgb(217 255 48 / 1)");
});

test("uncontrolled RGBA paste and native form reset preserve all four channels", async ({
  page,
}) => {
  await page.goto(story("form"));
  const plane = page.locator('[data-color-picker="plane"]');
  await paste(plane, "#33669980");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  const submitted = JSON.parse(
    (await page.getByLabel("Submitted channels").textContent())!,
  );
  expect(submitted).toEqual({
    "accent.r": "51",
    "accent.g": "102",
    "accent.b": "153",
    "accent.a": String(128 / 255),
  });
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(
    page.getByRole("slider", { name: "Opacity", exact: true }),
  ).toHaveValue("0.75");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByLabel("Submitted channels")).toHaveText(
    JSON.stringify({
      "accent.r": "217",
      "accent.g": "255",
      "accent.b": "48",
      "accent.a": "0.75",
    }),
  );
});

test("disabled and read-only pickers reject changes; localized labels and errors remain accessible", async ({
  page,
}) => {
  await page.goto(story("disabled"));
  await expect(
    page.getByRole("slider", { name: "Hue", exact: true }),
  ).toBeDisabled();
  await expect(page.locator('[data-color-picker="plane"]')).toHaveAttribute(
    "tabindex",
    "-1",
  );
  await page.goto(story("read-only"));
  const hue = page.getByRole("slider", { name: "Hue", exact: true });
  const before = await hue.inputValue();
  await hue.press("ArrowUp");
  await expect(hue).toHaveValue(before);
  await paste(page.locator('[data-color-picker="plane"]'), "#000");
  await expect(
    page.getByRole("slider", { name: "Brightness", exact: true }),
  ).toHaveValue("1");
  await page.goto(story("localized"));
  await expect(
    page.getByRole("group", { name: "색상 영역", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("slider", { name: "투명도", exact: true }),
  ).toBeVisible();
  await page.goto(story("invalid"));
  await expect(
    page.getByRole("slider", { name: "Hue", exact: true }),
  ).toHaveAccessibleDescription("Choose a color from the approved palette.");
});

test("touch selection and caller-owned replacements update the marker and gradients", async ({
  browser,
  page,
  baseURL,
}) => {
  const touch = await browser.newContext({
    baseURL,
    hasTouch: true,
    viewport: { width: 390, height: 640 },
  });
  const mobile = await touch.newPage();
  await mobile.goto(story("default"));
  const box = (await mobile
    .locator('[data-color-picker="plane"]')
    .boundingBox())!;
  await mobile.touchscreen.tap(box.x + box.width / 4, box.y + box.height / 4);
  await expect(
    mobile.getByRole("slider", { name: "Saturation", exact: true }),
  ).toHaveValue("0.25");
  await expect(
    mobile.getByRole("slider", { name: "Brightness", exact: true }),
  ).toHaveValue("0.75");
  await touch.close();
  await page.goto(story("preview"));
  await page.getByRole("button", { name: "Use blue" }).click();
  await expect(page.getByLabel("RGB value")).toHaveText("rgb(32 128 255 / 1)");
});

test("composed horizontal parts share RGB state and native horizontal range behavior", async ({
  page,
}) => {
  await page.goto(story("horizontal"));
  const plane = page.locator('[data-color-picker="plane"]');
  const area = (await plane.boundingBox())!;
  const hue = page.getByRole("slider", { name: "Hue", exact: true });
  const alpha = page.getByRole("slider", { name: "Opacity", exact: true });
  for (const rail of [hue, alpha]) {
    await expect(rail).toHaveAttribute("aria-orientation", "horizontal");
    const box = (await rail.boundingBox())!;
    expect(box.y).toBeGreaterThan(area.y + area.height);
    expect(box.width).toBeGreaterThan(box.height);
    expect(box.width).toBeCloseTo(area.width, 0);
    await page.mouse.click(box.x + 1, box.y + box.height / 2);
    await expect(rail).toHaveValue("0");
    await page.mouse.click(box.x + box.width - 1, box.y + box.height / 2);
    await expect(rail).toHaveValue((await rail.getAttribute("max"))!);
    await rail.press("Home");
    await rail.press("ArrowRight");
    expect(Number(await rail.inputValue())).toBeGreaterThan(0);
    await rail.press("ArrowLeft");
    await expect(rail).toHaveValue("0");
  }
  await alpha.press("End");
  await plane.focus();
  await plane.press("Home");
  await plane.press("Shift+ArrowRight");
  await expect(page.getByLabel("RGB value")).toHaveText("rgb(255 230 230 / 1)");
});

test("caller can reorder parts through wrappers or omit rails while keeping independent roots", async ({
  page,
}) => {
  await page.goto(story("custom-layout"));
  const hue = page.getByRole("slider", { name: "Hue", exact: true });
  const alpha = page.getByRole("slider", { name: "Opacity", exact: true });
  const plane = page.locator('[data-color-picker="plane"]');
  const area = (await plane.boundingBox())!;
  const left = (await hue.boundingBox())!;
  const bottom = (await alpha.boundingBox())!;
  expect(left.x + left.width).toBeLessThan(area.x);
  expect(bottom.y).toBeGreaterThan(area.y + area.height);
  expect(bottom.x).toBeCloseTo(area.x, 0);
  expect(area.height).toBe(180);
  expect(left.height).toBe(area.height);
  await page.getByRole("button", { name: "Use blue" }).click();
  await expect(alpha).toHaveValue("0.4");
  await expect(page.getByLabel("RGB value")).toHaveText(
    "rgb(32 128 255 / 0.4)",
  );
  await plane.press("End");
  await hue.press("Home");
  await plane.press("Home");
  await plane.press("Shift+ArrowRight");
  await expect(page.getByLabel("RGB value")).toHaveText(
    "rgb(255 230 230 / 0.4)",
  );

  await page.goto(story("area-only"));
  await expect(
    page.getByRole("slider", { name: "Hue", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("slider", { name: "Opacity", exact: true }),
  ).toHaveCount(0);
  await page.locator('[data-color-picker="plane"]').press("Home");
  await expect(
    page.getByRole("slider", { name: "Saturation", exact: true }),
  ).toHaveValue("0");

  await page.goto(story("independent-roots"));
  const first = page.getByRole("group", { name: "First color", exact: true });
  const second = page.getByRole("group", { name: "Second color", exact: true });
  const secondHue = second.getByRole("slider", { name: "Hue", exact: true });
  const before = await secondHue.inputValue();
  await paste(first.locator('[data-color-picker="plane"]'), "#ff000080");
  await expect(
    first.getByRole("slider", { name: "Hue", exact: true }),
  ).toHaveValue("0");
  await expect(secondHue).toHaveValue(before);
  await expect(
    second.getByRole("slider", { name: "Opacity", exact: true }),
  ).toHaveValue("0.4");
  const ids = await page
    .locator('[data-color-picker="plane"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("aria-describedby")),
    );
  expect(ids[0]).not.toBe(ids[1]);
});

test("composed root owns form channels, reset and shared disabled/read-only state", async ({
  page,
}) => {
  await page.goto(story("composed-form"));
  const plane = page.locator('[data-color-picker="plane"]');
  const hue = page.getByRole("slider", { name: "Hue", exact: true });
  const alpha = page.getByRole("slider", { name: "Opacity", exact: true });
  await expect(
    page.locator('input[type="hidden"][name^="accent."]'),
  ).toHaveCount(4);
  await paste(plane, "#33669980");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByLabel("Submitted channels")).toHaveText(
    JSON.stringify({
      "accent.r": "51",
      "accent.g": "102",
      "accent.b": "153",
      "accent.a": String(128 / 255),
    }),
  );
  await page.getByRole("button", { name: "Toggle read only" }).click();
  const before = await hue.inputValue();
  await hue.press("End");
  await expect(hue).toHaveValue(before);
  await plane.press("Home");
  await paste(plane, "#000");
  // The native range snaps its displayed value to step=.001; submitted alpha remains exact.
  await expect(alpha).toHaveValue("0.502");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByLabel("Submitted channels")).toHaveText(
    JSON.stringify({
      "accent.r": "51",
      "accent.g": "102",
      "accent.b": "153",
      "accent.a": String(128 / 255),
    }),
  );
  await page.getByRole("button", { name: "Toggle disabled" }).click();
  await expect(hue).toBeDisabled();
  await expect(alpha).toBeDisabled();
  await expect(plane).toHaveAttribute("tabindex", "-1");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByLabel("Submitted channels")).toHaveText("{}");
  await page.getByRole("button", { name: "Toggle disabled" }).click();
  await page.getByRole("button", { name: "Toggle read only" }).click();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(alpha).toHaveValue("0.75");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByLabel("Submitted channels")).toHaveText(
    JSON.stringify({
      "accent.r": "217",
      "accent.g": "255",
      "accent.b": "48",
      "accent.a": "0.75",
    }),
  );
});
