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

test("gradient clicks select a shade with no numeric channel inputs", async ({
  page,
}) => {
  await page.goto(story("default"));
  await expect(page.getByRole("spinbutton")).toHaveCount(0);
  const hue = page.getByRole("slider", { name: "Hue", exact: true });
  await hue.focus();
  await hue.press("Home");
  const plane = page.locator('[data-color-picker="plane"]');
  const box = (await plane.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByLabel("RGB value")).toHaveText("rgb(128 64 64 / 1)");
  await expect(page.locator('[data-color-picker="preview"]')).toHaveCSS(
    "background-color",
    "rgb(128, 64, 64)",
  );
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
  await page.goto(story("default"));
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
  await page.goto(story("default"));
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
  await expect(page.locator('[data-color-picker="preview"]')).toHaveCSS(
    "background-color",
    "rgba(217, 255, 48, 0.75)",
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
  await hue.press("ArrowRight");
  await expect(hue).toHaveValue(before);
  await paste(page.locator('[data-color-picker="plane"]'), "#000");
  await expect(page.getByLabel("RGB value")).toHaveText("rgb(217 255 48 / 1)");
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
