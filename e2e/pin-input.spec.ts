import { expect, test, type Locator } from "@playwright/test";

async function paste(input: Locator, text: string) {
  await input.evaluate((element, text) => {
    const data = new DataTransfer();
    data.setData("text/plain", text);
    element.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      }),
    );
  }, text);
}

test("typing advances slots, arrows replace digits and Backspace edits with one tab stop", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-pininput--default&viewMode=story",
  );
  const input = page.getByRole("textbox", { name: "Verification code" });
  await expect(page.getByRole("textbox")).toHaveCount(1);
  await expect(page.locator("[data-pin-slot]")).toHaveCount(6);
  await input.focus();
  for (let index = 0; index < 5; index++) {
    await input.press(String(index + 1));
    await expect(
      page.locator(`[data-pin-slot="${index + 1}"]`),
    ).toHaveAttribute("data-active", "true");
  }
  await input.press("6");
  await expect(input).toHaveValue("123456");
  await expect(page.getByLabel("Completed codes")).toHaveText("1");
  await input.press("Backspace");
  await expect(input).toHaveValue("12345");
  await input.press("ArrowLeft");
  await input.press("9");
  await expect(input).toHaveValue("12349");
  await input.press("Home");
  await input.press("8");
  await expect(input).toHaveValue("82349");
  await input.press("ArrowRight");
  await input.press("Delete");
  await expect(input).toHaveValue("8249");
  await input.press("ControlOrMeta+A");
  await input.pressSequentially("00789012");
  await expect(input).toHaveValue("007890");
  await expect(page.getByLabel("Completed codes")).toHaveText("2");
  await input.press("Tab");
  await expect(page.getByRole("button", { name: "Clear" })).toBeFocused();
});

test("device codes group four-by-four, normalize pasted separators and support replacing middle slots", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-pininput--device-code&viewMode=story",
  );
  const input = page.getByRole("textbox", { name: "Device code" });
  await expect(page.locator("[data-pin-slot]")).toHaveCount(8);
  await expect(input).toHaveAttribute("autocomplete", "one-time-code");
  await input.focus();
  await paste(input, "ab12-cd34");
  await expect(input).toHaveValue("AB12CD34");
  await expect(page.getByLabel("Completed codes")).toHaveText("1");
  const target = (await page.locator('[data-pin-slot="2"]').boundingBox())!;
  await page.mouse.click(
    target.x + target.width / 2,
    target.y + target.height / 2,
  );
  await input.press("z");
  await expect(input).toHaveValue("ABZ2CD34");
  await input.evaluate((node) =>
    (node as HTMLInputElement).setSelectionRange(2, 4),
  );
  await paste(input, "xy");
  await expect(input).toHaveValue("ABXYCD34");
  await paste(input, "1234-5678");
  await expect(input).toHaveValue("12345678");
  const completed = await page.getByLabel("Completed codes").textContent();
  await paste(input, "1234-5678");
  await expect(page.getByLabel("Completed codes")).toHaveText(completed!);
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(input).toHaveValue("");
  await input.focus();
  await input.press("a");
  await expect(input).toHaveValue("A");
  await expect(page.locator('[data-pin-slot="1"]')).toHaveAttribute(
    "data-active",
    "true",
  );
});

test("autofill and IME commit preserve native input semantics and normalize fullwidth digits", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-pininput--default&viewMode=story",
  );
  const input = page.getByRole("textbox", { name: "Verification code" });
  await input.fill("987654");
  await expect(input).toHaveValue("987654");
  await expect(page.getByLabel("Completed codes")).toHaveText("1");
  await page.getByRole("button", { name: "Clear" }).click();
  await input.focus();
  await input.dispatchEvent("compositionstart");
  await page.keyboard.insertText("１２");
  await expect(page.getByLabel("Current code")).toHaveText("Empty");
  await input.dispatchEvent("compositionend", { data: "１２" });
  await expect(input).toHaveValue("12");
  await expect(page.getByLabel("Current code")).toHaveText("12");
  await expect(page.locator('[data-pin-slot="2"]')).toHaveAttribute(
    "data-active",
    "true",
  );
  await input.press("x");
  await expect(input).toHaveValue("12");
});

test("native form submission, validation, reset and input ref use one unformatted value", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-pininput--native-form&viewMode=story",
  );
  const input = page.getByRole("textbox", { name: "Device code" });
  await expect(input).toHaveValue("AB");
  expect(
    await input.evaluate((node) => (node as HTMLInputElement).checkValidity()),
  ).toBe(false);
  await input.focus();
  await paste(input, "ef56-gh78");
  expect(
    await input.evaluate((node) => (node as HTMLInputElement).checkValidity()),
  ).toBe(true);
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByLabel("Submitted code")).toHaveText("EF56GH78");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(input).toHaveValue("AB");
  await page.getByRole("button", { name: "Focus code" }).click();
  await expect(input).toBeFocused();
  await expect(page.locator('[data-pin-slot="2"]')).toHaveAttribute(
    "data-active",
    "true",
  );
});

test("masked, disabled, read-only and invalid states preserve native semantics", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=components-pininput--masked&viewMode=story");
  const masked = page.getByLabel("Secret PIN", { exact: true });
  await expect(masked).toHaveAttribute("type", "password");
  await expect(masked).toHaveValue("1234");
  await expect(page.locator("[data-pin-slot]")).toHaveText([
    "•",
    "•",
    "•",
    "•",
  ]);
  await page.goto(
    "/iframe.html?id=components-pininput--disabled&viewMode=story",
  );
  await expect(page.getByRole("textbox")).toBeDisabled();
  await page.goto(
    "/iframe.html?id=components-pininput--read-only&viewMode=story",
  );
  const readonly = page.getByRole("textbox");
  await readonly.focus();
  await paste(readonly, "654321");
  await readonly.press("7");
  await expect(readonly).toHaveValue("123456");
  await page.goto(
    "/iframe.html?id=components-pininput--invalid&viewMode=story",
  );
  await expect(page.getByRole("textbox")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByRole("textbox")).toHaveAccessibleDescription(
    "That code was not accepted. Try again.",
  );
});

for (const theme of ["dark", "light"]) {
  test(`slots use shared ${theme} tokens and reduced motion disables caret blinking`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(
      `/iframe.html?id=components-pininput--default&viewMode=story&globals=theme:${theme}`,
    );
    const input = page.getByRole("textbox");
    await input.focus();
    const style = await page
      .locator('[data-pin-slot="0"]')
      .evaluate((node) => ({
        color: getComputedStyle(node).color,
        background: getComputedStyle(node).backgroundColor,
        outline: getComputedStyle(node).outlineStyle,
        animation: getComputedStyle(node, "::after").animationName,
      }));
    expect(style.color).toBe(
      theme === "dark" ? "rgb(237, 237, 237)" : "rgb(18, 18, 18)",
    );
    expect(style.background).toBe(
      theme === "dark" ? "rgb(24, 24, 24)" : "rgb(247, 247, 247)",
    );
    expect(style.outline).toBe("solid");
    expect(style.animation).toBe("none");
  });
}

test.describe("touch layout", () => {
  test.use({
    viewport: { width: 320, height: 640 },
    isMobile: true,
    hasTouch: true,
  });
  test("eight grouped slots fit a narrow surface and accept touch/keyboard input", async ({
    page,
  }) => {
    await page.goto(
      "/iframe.html?id=components-pininput--device-code&viewMode=story",
    );
    const input = page.getByRole("textbox", { name: "Device code" });
    const last = (await page.locator('[data-pin-slot="7"]').boundingBox())!;
    expect(last.x + last.width).toBeLessThanOrEqual(320);
    const first = (await page.locator('[data-pin-slot="0"]').boundingBox())!;
    await page.touchscreen.tap(
      first.x + first.width / 2,
      first.y + first.height / 2,
    );
    await expect(input).toBeFocused();
    await page.keyboard.insertText("ab12cd34");
    await expect(input).toHaveValue("AB12CD34");
  });
});
