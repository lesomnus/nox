import { expect, test, type Locator } from "@playwright/test";
async function sample(root: Locator) {
  return root.evaluate((node) => {
    const animations = node
      .getAnimations({ subtree: true })
      .filter((animation) => animation instanceof CSSAnimation);
    for (const animation of animations) {
      animation.pause();
      animation.currentTime =
        Number(animation.effect!.getTiming().duration) / 4;
    }
    const first = node.getBoundingClientRect().toJSON();
    for (const animation of animations)
      animation.currentTime =
        Number(animation.effect!.getTiming().duration) * 0.75;
    return {
      names: animations.map(
        (animation) => (animation as CSSAnimation).animationName,
      ),
      first,
      last: node.getBoundingClientRect().toJSON(),
    };
  });
}
for (const [label, origin] of [
  ["Below", "from-top-right"],
  ["Above", "from-bottom-right"],
  ["Beside", "from-left"],
]) {
  test(`automatic ${label} menus reveal from the trigger without moving their frame`, async ({
    page,
  }) => {
    await page.goto(
      "/iframe.html?id=menus--placement-and-motion&viewMode=story",
    );
    await page.addStyleTag({
      content: ":root { --ui-menu-reveal-duration: 2s; }",
    });
    const trigger = page.getByRole("button", { name: label, exact: true });
    await trigger.evaluate((node) =>
      Object.assign(node.closest<HTMLElement>(".action-menu")!.style, {
        position: "fixed",
        top: "320px",
        left: "320px",
      }),
    );
    await trigger.click();
    const menu = page.getByRole("menu", { name: label, exact: true });
    await expect(menu).toHaveAttribute("data-enter-from", origin);
    const motion = await sample(menu);
    expect(motion.names.some((name) => name.includes("reveal"))).toBe(true);
    expect(motion.first).toEqual(motion.last);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
  });
}

test("automatic menus change their reveal origin when the viewport forces them above", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=components-actionmenu--more&viewMode=story");
  const trigger = page.getByRole("button", { name: "More", exact: true });
  await trigger.evaluate((node) =>
    Object.assign(node.closest<HTMLElement>(".action-menu")!.style, {
      position: "fixed",
      bottom: "8px",
      right: "8px",
    }),
  );
  await trigger.click();
  const menu = page.getByRole("menu", { name: "More", exact: true });
  await expect(menu).toHaveAttribute("data-enter-from", "from-bottom-right");
  await expect(menu.locator("[data-menu-frame]")).toHaveAttribute(
    "data-enter-from",
    "from-bottom-right",
  );
  expect(
    (await menu.boundingBox())!.y + (await menu.boundingBox())!.height,
  ).toBeLessThanOrEqual((await trigger.boundingBox())!.y);
});

test("explicit no-motion and reduced-motion preferences skip menu entrances", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=menus--placement-and-motion&viewMode=story");
  await page.getByRole("button", { name: "No motion", exact: true }).click();
  expect(
    (await sample(page.getByRole("menu", { name: "No motion", exact: true })))
      .names,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Below", exact: true }).click();
  expect(
    (await sample(page.getByRole("menu", { name: "Below", exact: true })))
      .names,
  ).toEqual([]);
});

test("editable action popup animates while the input remains in place", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-descriptionlist--editable&viewMode=story",
  );
  const trigger = page.getByRole("button", { name: "Edit Name", exact: true });
  const box = (await trigger.boundingBox())!;
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Edit Name", exact: true });
  const overlay = dialog.locator(".editable-value-overlay");
  await expect(overlay).toHaveAttribute("data-enter-from", "from-top");
  expect(
    (await sample(overlay)).names.some((name) => name.includes("enter")),
  ).toBe(true);
  const input = (await dialog
    .getByRole("textbox", { name: "Name", exact: true })
    .boundingBox())!;
  for (const key of ["x", "y", "width", "height"] as const)
    expect(input[key]).toBeCloseTo(box[key], 1);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("overlay FindBar fades without changing search geometry and respects reduced motion", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=components-findbar--overlay&viewMode=story");
  await page.getByRole("button", { name: "Close search" }).click();
  await page.addStyleTag({
    content: ":root { --ui-dialog-enter-duration: 2s; }",
  });
  await page.getByRole("button", { name: "Open search" }).click();
  const bar = page.getByRole("search");
  const motion = await sample(bar);
  expect(motion.names.some((name) => name.includes("backdrop-enter"))).toBe(
    true,
  );
  expect(motion.first).toEqual(motion.last);
  await page.getByRole("button", { name: "Close search" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Open search" }).click();
  expect((await sample(bar)).names).toEqual([]);
});
