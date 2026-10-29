import { expect, test, type Locator } from "@playwright/test";

async function aligned(
  anchor: { x: number; y: number; height: number },
  option: Locator,
) {
  await expect
    .poll(async () => {
      const box = (await option.locator(".setting-match-label").boundingBox())!;
      return Math.abs(box.y + box.height / 2 - anchor.y - anchor.height / 2);
    })
    .toBeLessThan(0.75);
  const box = (await option.locator(".setting-match-label").boundingBox())!;
  expect(Math.abs(box.x - anchor.x)).toBeLessThan(0.75);
}

for (const [component, reducedMotion] of [
  ["valuemenu", false],
  ["prefixvaluemenu", false],
  ["valuemenu", true],
] as const) {
  test(`${component} keeps its value visible and stationary during entrance${reducedMotion ? " with reduced motion" : ""}`, async ({
    page,
  }) => {
    await page.emulateMedia({
      reducedMotion: reducedMotion ? "reduce" : "no-preference",
    });
    await page.goto(
      `/iframe.html?id=components-${component}--item-aligned&viewMode=story`,
    );
    const trigger = page.getByRole("combobox", { name: "Effort", exact: true });
    const frames = await trigger.evaluate(async (node) => {
      const anchor = node.querySelector(".meta-value")!.getBoundingClientRect();
      const opacity = (element: Element | null) => {
        let result = element ? 1 : 0;
        for (let current = element; current; current = current.parentElement)
          result *= Number(getComputedStyle(current).opacity);
        return result;
      };
      const frames: {
        visible: number;
        other: number;
        dx: number;
        dy: number;
        top: number;
        bottom: number;
      }[] = [];
      (node as HTMLButtonElement).click();
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const sample = () => {
          const selected = document.querySelector(
            '.setting-menu [aria-selected="true"] .setting-match-label',
          );
          const rect = selected?.getBoundingClientRect();
          const other = document.querySelector(
            '.setting-menu [aria-selected="false"]',
          );
          const popup = document.querySelector(".setting-menu")!;
          const bounds = popup.getBoundingClientRect();
          const insets = getComputedStyle(popup)
            .clipPath.match(/inset\(([^)]+)\)/)?.[1]
            .split(" ")
            .map(parseFloat) ?? [0];
          frames.push({
            visible: Math.max(
              opacity(node.querySelector(".button-content")),
              opacity(selected),
            ),
            other: opacity(other),
            top: bounds.top + Math.max(0, insets[0]),
            bottom: bounds.bottom - Math.max(0, insets[2] ?? insets[0]),
            dx: rect ? Math.abs(rect.left - anchor.left) : Infinity,
            dy: rect
              ? Math.abs(
                  rect.top + rect.height / 2 - anchor.top - anchor.height / 2,
                )
              : Infinity,
          });
          if (performance.now() - start < 350) requestAnimationFrame(sample);
          else resolve();
        };
        requestAnimationFrame(sample);
      });
      return frames;
    });
    expect(frames.length).toBeGreaterThan(3);
    expect(Math.min(...frames.map((frame) => frame.visible))).toBeGreaterThan(
      0.99,
    );
    expect(Math.max(...frames.map((frame) => frame.dx))).toBeLessThan(0.75);
    expect(Math.max(...frames.map((frame) => frame.dy))).toBeLessThan(0.75);
    if (!reducedMotion) {
      expect(Math.min(...frames.map((frame) => frame.other))).toBeLessThan(
        0.99,
      );
      expect(frames[0].top - frames.at(-1)!.top).toBeGreaterThan(10);
      expect(frames.at(-1)!.bottom - frames[0].bottom).toBeGreaterThan(10);
    } else {
      expect(Math.min(...frames.map((frame) => frame.other))).toBeGreaterThan(
        0.99,
      );
      expect(
        frames.every((frame) => Math.abs(frame.top - frames[0].top) < 0.75),
      ).toBe(true);
      expect(
        frames.every(
          (frame) => Math.abs(frame.bottom - frames[0].bottom) < 0.75,
        ),
      ).toBe(true);
    }
    expect(frames.at(-1)!.other).toBeGreaterThan(0.99);
    if (component === "valuemenu" && !reducedMotion)
      await page.screenshot({ path: test.info().outputPath("opened.png") });
  });
}

for (const deviceScaleFactor of [1, 1.5]) {
  test.describe(`item alignment at scale ${deviceScaleFactor}`, () => {
    test.use({ deviceScaleFactor });
    test("the actual selected option overlays the trigger in source order without a duplicate current row", async ({
      page,
    }) => {
      await page.goto(
        "/iframe.html?id=components-valuemenu--selection-events&viewMode=story&args=alignItemWithTrigger:true",
      );
      const trigger = page.getByRole("combobox", {
        name: "Effort",
        exact: true,
      });
      const anchor = (await trigger.locator(".meta-value").boundingBox())!;
      const before = await trigger.boundingBox();
      await trigger.click();
      const popup = page.locator(".setting-menu");
      const list = page.getByRole("listbox");
      const selected = list.locator('[aria-selected="true"]');
      await expect(popup).toHaveAttribute("data-item-alignment", "selected");
      await expect(popup.locator(".setting-current")).toHaveCount(0);
      expect(
        await list
          .getByRole("option")
          .evaluateAll((nodes) =>
            nodes.map((n) => n.getAttribute("data-option-value")),
          ),
      ).toEqual(["default", "low", "medium", "high"]);
      await expect(selected).toHaveCount(1);
      await expect(selected).toBeFocused();
      await aligned(anchor, selected);
      if (deviceScaleFactor === 1)
        await page.screenshot({
          path: test.info().outputPath("item-aligned.png"),
        });
      expect(await trigger.boundingBox()).toEqual(before);
      await expect(trigger.locator(".button-content")).toHaveCSS(
        "opacity",
        "0",
      );
      await selected.click();
      await expect(popup).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(trigger.locator(".button-content")).toHaveCSS(
        "opacity",
        "1",
      );
      await expect(page.getByRole("status")).toHaveText("Changes: 0");
      await trigger.press("ArrowDown");
      await expect(selected).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(
        list.getByRole("option", { name: "low", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(trigger).toHaveText("low");
      await expect(page.getByRole("status")).toHaveText("Changes: 1");
    });
  });
}

test("compact prefix selectors forward item alignment and retain their typography", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-prefixvaluemenu--item-aligned&viewMode=story",
  );
  const trigger = page.getByRole("combobox");
  const anchor = (await trigger.locator(".meta-value").boundingBox())!;
  await trigger.click();
  const option = page.getByRole("listbox").locator('[aria-selected="true"]');
  await aligned(anchor, option);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("groups, icons, fixed regions and disabled choices share the same item-aligned list", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=menus--item-alignment&viewMode=story");
  await page
    .getByRole("button", { name: "Groups and icons", exact: true })
    .click();
  const trigger = page.getByRole("combobox", {
    name: "Selected item",
    exact: true,
  });
  const anchor = (await trigger.locator(".meta-value").boundingBox())!;
  await trigger.click();
  const popup = page.locator(".setting-menu");
  const list = popup.getByRole("listbox");
  await expect(
    list.getByRole("group", { name: "Quick", exact: true }),
  ).toBeVisible();
  await expect(
    list.getByRole("group", { name: "Deep", exact: true }),
  ).toBeVisible();
  await expect(popup.locator('[data-menu-fixed="header"]')).toHaveText(
    "Choose an effort",
  );
  await expect(popup.locator('[data-menu-fixed="footer"]')).toContainText(
    "Escape to close",
  );
  await aligned(anchor, list.locator('[aria-selected="true"]'));
  await expect(
    list.getByRole("option", { name: "High", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("ArrowDown");
  await expect(
    list.getByRole("option", { name: "Maximum", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("long lists reveal the selected option and scroll independently of the popup", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=menus--item-alignment&viewMode=story");
  await page.getByRole("button", { name: "Long list", exact: true }).click();
  const trigger = page.getByRole("combobox", {
    name: "Selected item",
    exact: true,
  });
  const anchor = (await trigger.locator(".meta-value").boundingBox())!;
  await trigger.click();
  const popup = page.locator(".setting-menu");
  const list = popup.getByRole("listbox");
  const viewport = list.locator('[data-scroll-area="viewport"]');
  await expect(list.getByRole("option")).toHaveCount(80);
  await aligned(anchor, list.locator('[aria-selected="true"]'));
  await expect
    .poll(() => viewport.evaluate((n) => n.scrollTop))
    .toBeGreaterThan(0);
  const box = await popup.boundingBox();
  const fixed = await popup.locator('[data-menu-fixed="footer"]').boundingBox();
  await page.keyboard.press("Home");
  await expect(
    list.getByRole("option", { name: "Entry 1", exact: true }),
  ).toBeFocused();
  await expect.poll(() => viewport.evaluate((n) => n.scrollTop)).toBe(0);
  await viewport.hover();
  await page.mouse.wheel(0, 100);
  await expect
    .poll(() => viewport.evaluate((n) => n.scrollTop))
    .toBeGreaterThan(0);
  expect(await popup.boundingBox()).toEqual(box);
  expect(
    await popup.locator('[data-menu-fixed="footer"]').boundingBox(),
  ).toEqual(fixed);
  await page.keyboard.press("End");
  await expect(
    list.getByRole("option", { name: "Entry 80", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveText("Entry 80");
});

for (const side of ["top", "bottom"]) {
  test(`a trigger at the ${side} edge uses bounded edge placement`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 240 });
    await page.goto(
      "/iframe.html?id=components-valuemenu--item-aligned&viewMode=story",
    );
    const trigger = page.getByRole("combobox");
    await trigger.locator("..").evaluate((node, side) => {
      Object.assign((node as HTMLElement).style, {
        position: "fixed",
        left: "20px",
        width: "180px",
        [side]: "0px",
      });
    }, side);
    await trigger.click();
    const popup = page.locator(".setting-menu");
    await expect(popup).toHaveAttribute("data-item-alignment", "edge");
    const box = (await popup.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    expect(box.y + box.height).toBeLessThanOrEqual(240);
    await expect(trigger.locator(".button-content")).toHaveCSS("opacity", "1");
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });
}

test("a disabled selected option stays aligned while navigation moves to an enabled successor", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-valuemenu--item-aligned&viewMode=story&args=value:high",
  );
  const trigger = page.getByRole("combobox");
  const anchor = (await trigger.locator(".meta-value").boundingBox())!;
  await trigger.click();
  const list = page.getByRole("listbox");
  const selected = list.locator('[aria-selected="true"]');
  await expect(selected).toBeDisabled();
  await aligned(anchor, selected);
  await page.keyboard.press("ArrowDown");
  await expect(
    list.getByRole("option", { name: "Maximum", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveText("Maximum");
});

for (const args of ["searchable:true", "hideSelected:true", "value:unknown"]) {
  test(`the original current row remains available for ${args}`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-valuemenu--item-aligned&viewMode=story&args=${args}`,
    );
    await page.getByRole("combobox", { name: "Effort", exact: true }).click();
    await expect(page.locator(".setting-menu .setting-current")).toBeVisible();
    await expect(page.locator(".setting-menu")).not.toHaveAttribute(
      "data-align-item-with-trigger",
      "true",
    );
  });
}

test("item-aligned menus remain in a native dialog and Escape dismisses only the menu", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=menus--item-alignment&viewMode=story");
  await page.getByRole("button", { name: "Open dialog", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Choose effort",
    exact: true,
  });
  await expect
    .poll(() =>
      dialog
        .locator(":scope > [data-motion]")
        .evaluate((node) =>
          node
            .getAnimations()
            .every((animation) => animation.playState === "finished"),
        ),
    )
    .toBe(true);
  const trigger = dialog.getByRole("combobox", {
    name: "Dialog effort",
    exact: true,
  });
  const anchor = (await trigger.locator(".meta-value").boundingBox())!;
  await trigger.click();
  await aligned(
    anchor,
    dialog.getByRole("listbox").locator('[aria-selected="true"]'),
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("listbox")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
