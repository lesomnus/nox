import { expect, test, type Page } from "@playwright/test";

const story =
  "/iframe.html?id=components-pininput--verification&viewMode=story";
const colors = (page: Page) =>
  page
    .locator("[data-pin-slot]")
    .evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).borderColor),
    );

for (const theme of ["dark", "light"] as const) {
  test(`${theme} verification disables while pending, shows failure/success and clears feedback on edit without shifting layout`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${story}&globals=theme:${theme}`);
    const input = page.getByRole("textbox", { name: "Verification code" });
    const status = page.getByRole("status");
    const example = page.getByRole("region", {
      name: "PinInput failure example",
    });
    const bounds = await example.boundingBox();
    await expect(status).toHaveText("Enter a complete code");
    await input.fill("12345");
    await expect(input).toBeEnabled();
    await expect(status).toHaveText("Enter a complete code");

    await input.press("6");
    await expect(input).toBeDisabled();
    await expect(input).toHaveAttribute("aria-busy", "true");
    await expect(status).toHaveText("Verifying code…");
    expect(await example.boundingBox()).toEqual(bounds);
    await expect(status).toHaveText("Verification failed");
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue("123456");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect
      .poll(() => colors(page))
      .toEqual(Array(6).fill("rgb(219, 112, 112)"));
    await expect(input).toBeFocused();
    expect(await example.boundingBox()).toEqual(bounds);

    await input.press("Backspace");
    await expect(input).toHaveValue("12345");
    await expect(input).toHaveAttribute("aria-invalid", "false");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(status).toHaveText("Enter a complete code");
    expect(await colors(page)).not.toContain("rgb(219, 112, 112)");

    await input.press("6");
    await expect(input).toBeDisabled();
    await expect(status).toHaveText("Verifying code…");
    await expect(status).toHaveText("Code verified");
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue("123456");
    const green = theme === "dark" ? "rgb(112, 181, 132)" : "rgb(47, 130, 80)";
    await input.hover();
    await input.focus();
    expect(await colors(page)).toEqual(Array(6).fill(green));
    expect(await example.boundingBox()).toEqual(bounds);
    await input.blur();
    expect(await colors(page)).toEqual(Array(6).fill(green));

    await input.focus();
    await input.press("Backspace");
    await expect(input).toHaveValue("12345");
    await expect(status).toHaveText("Enter a complete code");
    expect(await colors(page)).not.toContain(green);
    await expect(input).toHaveAttribute("aria-invalid", "false");
    expect(await example.boundingBox()).toEqual(bounds);
    expect(errors).toEqual([]);
  });
}

test("completing verification does not steal focus from another control", async ({
  page,
}) => {
  await page.goto(story);
  const input = page.getByRole("textbox", { name: "Verification code" });
  await input.fill("123456");
  await expect(input).toBeDisabled();
  await page.evaluate(() => {
    const button = document.createElement("button");
    button.textContent = "Another control";
    document.body.append(button);
    button.focus();
  });
  await expect(page.getByRole("status")).toHaveText("Verification failed");
  await expect(input).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Another control" }),
  ).toBeFocused();
});
