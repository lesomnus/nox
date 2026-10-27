import { expect, test } from "@playwright/test";

test("toolbar toggle changes its border and icon without resizing in both themes", async ({
  page,
}) => {
  for (const theme of ["dark", "light"]) {
    await page.goto(
      `/iframe.html?id=components-togglebutton--toolbar&globals=theme:${theme}&viewMode=story`,
    );
    const button = page.getByRole("button", { name: "Show details" });
    await expect(button).toHaveAttribute("aria-pressed", "false");
    const before = await button.boundingBox();
    const icon = await button.locator("svg").innerHTML();
    await expect(button).toHaveCSS("box-shadow", "none");
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    expect(await button.boundingBox()).toEqual(before);
    await expect(button).not.toHaveCSS("box-shadow", "none");
    expect(await button.locator("svg").innerHTML()).not.toBe(icon);
    await button.press("Space");
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await button.press("Enter");
    await expect(button).toHaveAttribute("aria-pressed", "true");
  }
});

test("controlled state follows its owner", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=components-togglebutton--controlled&viewMode=story",
  );
  const button = page.getByRole("button", { name: "Bold", exact: true });
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status")).toHaveText("On");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(button).toHaveAttribute("aria-pressed", "false");
});

test("native button behavior supports refs, cancellation and blocked states", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-togglebutton--interaction&viewMode=story",
  );
  const button = page.getByRole("button", {
    name: "Uncontrolled",
    exact: true,
  });
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status")).toHaveText("Changes: 1; submits: 0");
  const controlled = page.getByRole("button", {
    name: "Controlled without update",
  });
  await controlled.click();
  await expect(controlled).toHaveAttribute("aria-pressed", "true");
  for (const name of ["Disabled", "Aria disabled", "Loading", "Prevented"]) {
    const blocked = page.getByRole("button", { name, exact: true });
    await blocked.evaluate((element: HTMLButtonElement) => element.click());
    await expect(blocked).toHaveAttribute("aria-pressed", "false");
  }
  await expect(page.getByRole("status")).toHaveText("Changes: 2; submits: 0");
  await page.getByRole("button", { name: "Focus toggle" }).click();
  await expect(button).toBeFocused();
});
