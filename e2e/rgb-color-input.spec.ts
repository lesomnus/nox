import { expect, test, type Locator } from "@playwright/test";

const story = (name: string) =>
  `/iframe.html?id=components-rgbcolorinput--${name}&viewMode=story`;
async function paste(input: Locator, text: string) {
  await input.evaluate((node, text) => {
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

test("controlled channels expose labels and update the preview with byte values", async ({
  page,
}) => {
  await page.goto(story("default"));
  const group = page.getByRole("group", { name: "Color", exact: true });
  const red = group.getByRole("spinbutton", { name: "Red" });
  const green = group.getByRole("spinbutton", { name: "Green" });
  const blue = group.getByRole("spinbutton", { name: "Blue" });
  await expect(red).toHaveValue("217");
  await red.fill("128");
  await red.press("ArrowUp");
  await expect(page.getByLabel("RGB value")).toHaveText("rgb(129 255 48)");
  await blue.fill("12.6");
  await blue.press("Tab");
  await expect(blue).toHaveValue("13");
  await green.fill("999");
  await green.press("Tab");
  await expect(green).toHaveValue("255");
  await red.fill("-10");
  await red.press("Tab");
  await expect(red).toHaveValue("0");
  await expect(group.locator('[data-rgb-color="preview"]')).toHaveCSS(
    "background-color",
    "rgb(0, 255, 13)",
  );
});

test("clearing a channel keeps an editable draft until blur or Escape", async ({
  page,
}) => {
  await page.goto(story("default"));
  const red = page.getByRole("spinbutton", { name: "Red" });
  await red.fill("");
  await expect(red).toHaveValue("");
  await expect(page.getByLabel("RGB value")).toHaveText("rgb(217 255 48)");
  await red.press("Tab");
  await expect(red).toHaveValue("217");
  await red.fill("");
  await red.press("Escape");
  await expect(red).toHaveValue("217");
});

test("complete RGB and hex pastes replace all channels in uncontrolled mode", async ({
  page,
}) => {
  await page.goto(story("uncontrolled"));
  const red = page.getByRole("spinbutton", { name: "Red" });
  const green = page.getByRole("spinbutton", { name: "Green" });
  const blue = page.getByRole("spinbutton", { name: "Blue" });
  await red.fill("");
  await paste(red, "#09f");
  await expect(red).toHaveValue("0");
  await expect(green).toHaveValue("153");
  await expect(blue).toHaveValue("255");
  await paste(green, "rgb(255 16 32)");
  await expect(red).toHaveValue("255");
  await expect(green).toHaveValue("16");
  await expect(blue).toHaveValue("32");
  await paste(blue, "rgba(1,2,3,.5)");
  await expect(blue).toHaveValue("32");
});

test("native form submission and reset preserve channel names and defaults", async ({
  page,
}) => {
  await page.goto(story("form"));
  const red = page.getByRole("spinbutton", { name: "Red" });
  await red.fill("13");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByLabel("Submitted channels")).toHaveText(
    '{"accent.r":"13","accent.g":"255","accent.b":"48"}',
  );
  await red.fill("999");
  await red.press("Enter");
  await expect(page.getByLabel("Submitted channels")).toHaveText(
    '{"accent.r":"255","accent.g":"255","accent.b":"48"}',
  );
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(red).toHaveValue("217");
  await expect(page.getByRole("spinbutton", { name: "Green" })).toHaveValue(
    "255",
  );
});

test("disabled and read-only inputs reject editing; labels can be localized", async ({
  page,
}) => {
  await page.goto(story("disabled"));
  for (const input of await page.getByRole("spinbutton").all())
    await expect(input).toBeDisabled();
  await page.goto(story("read-only"));
  const red = page.getByRole("spinbutton", { name: "Red" });
  await expect(red).toHaveAttribute("readonly", "");
  await red.press("ArrowUp");
  await paste(red, "#000");
  await expect(red).toHaveValue("217");
  await page.goto(story("localized"));
  await expect(
    page
      .getByRole("group", { name: "색상" })
      .getByRole("spinbutton", { name: "빨강" }),
  ).toHaveValue("217");
});

test("caller updates and validation descriptions reach the native controls", async ({
  page,
}) => {
  await page.goto(story("preview"));
  await page.getByRole("button", { name: "Use blue" }).click();
  await expect(page.getByRole("spinbutton", { name: "Red" })).toHaveValue("32");
  await expect(page.getByRole("spinbutton", { name: "Blue" })).toHaveValue(
    "255",
  );
  await page.goto(story("invalid"));
  const red = page.getByRole("spinbutton", { name: "Red" });
  await expect(red).toHaveAttribute("aria-invalid", "true");
  await expect(red).toHaveAccessibleDescription(
    "Choose a color from the approved palette.",
  );
});
