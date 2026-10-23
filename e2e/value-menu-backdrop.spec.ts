import { expect, test } from "@playwright/test";

test.use({
  launchOptions: {
    args: [
      "--no-zygote",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--renderer-process-limit=1",
    ],
  },
});

test("ValueMenu visibly blurs the StippleBackground behind its portaled surface", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(
    "/iframe.html?id=components-valuemenu--stipple-backdrop&viewMode=story",
  );
  const scene = page.locator("[data-renderer]");
  await expect(scene).toHaveAttribute("data-renderer", "webgl2", {
    timeout: 15000,
  });
  const trigger = page.getByRole("combobox", { name: "Effort" });
  await trigger.click();
  const menu = page.getByRole("listbox", { name: "Effort choices" });
  await expect(menu).toHaveCSS("backdrop-filter", "blur(24px)");
  await page.screenshot({ path: "test-results/value-menu-stipple.png" });
  const blurred = await menu.screenshot({ animations: "disabled" });
  await menu.evaluate((node) => {
    (node as HTMLElement).style.backdropFilter = "none";
  });
  const sharp = await menu.screenshot({ animations: "disabled" });
  expect(blurred.equals(sharp)).toBe(false);
  await menu.getByRole("option", { name: "high", exact: true }).click();
  await expect(trigger).toHaveText("high");
  expect(errors).toEqual([]);
});
