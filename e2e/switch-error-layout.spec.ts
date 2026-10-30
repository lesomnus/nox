import { expect, test, type Locator } from "@playwright/test";

async function spacing(control: Locator) {
  return control.evaluate((node) => {
    const track = node.getBoundingClientRect();
    const thumb = node.querySelector("span")!.getBoundingClientRect();
    return {
      track: {
        x: track.x,
        y: track.y,
        width: track.width,
        height: track.height,
      },
      thumb: {
        x: thumb.x,
        y: thumb.y,
        width: thumb.width,
        height: thumb.height,
      },
      top: thumb.top - track.top,
      bottom: track.bottom - thumb.bottom,
    };
  });
}

test("failed selection keeps the thumb centered when its error stroke appears and clears", async ({
  page,
}, info) => {
  await page.goto(
    "/iframe.html?id=patterns-handlerfailures--selection&viewMode=story&args=kind:switch",
  );
  const control = page.getByRole("switch", { name: "High quality" });
  const before = await spacing(control);
  expect(before.top).toBe(before.bottom);
  await control.click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(control).toHaveAttribute("data-action-error-open", "true");
  await control.evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .map((a) => a.finished.catch(() => {})),
    );
  });
  expect(await spacing(control)).toEqual(before);
  for (const width of [1, 3]) {
    await control.evaluate(
      (node, width) =>
        node.style.setProperty(
          "--ui-action-error-trigger-border-width",
          `${width}px`,
        ),
      width,
    );
    expect(await spacing(control)).toEqual(before);
  }
  await control.evaluate((node) =>
    node.style.removeProperty("--ui-action-error-trigger-border-width"),
  );
  await control.screenshot({ path: info.outputPath("switch-error.png") });
  await page.getByRole("button", { name: "Dismiss error" }).click();
  await expect(control).not.toHaveAttribute("data-action-error-open");
  expect(await spacing(control)).toEqual(before);
});

for (const state of ["default", "off", "turning-on", "turning-off"]) {
  test(`${state} thumb has equal upper and lower track spacing`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(
      `/iframe.html?id=components-switch--${state}&viewMode=story`,
    );
    const control = page.getByRole("switch");
    const layout = await spacing(control);
    expect(layout.top).toBe(layout.bottom);
    expect(layout.top).toBeGreaterThan(0);
  });
}
