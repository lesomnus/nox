import { expect, test } from "@playwright/test";

test("searchable value rows preserve custom form padding across the portal", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-valuemenu--searchable&viewMode=story",
  );
  const trigger = page.locator(".setting-trigger");
  await trigger.evaluate((node) => {
    node.style.padding = "11px 12px";
    node.style.height = "42px";
    node.parentElement!.style.height = "42px";
  });
  await trigger.click();
  const search = page.locator(".setting-search");
  const row = page.locator(".setting-search-row");
  for (const padding of ["11px 12px", "15px 16px"]) {
    await trigger.evaluate((node, padding) => {
      node.style.padding = padding;
      const height = `${20 + 2 * parseFloat(padding)}px`;
      node.style.height = height;
      node.parentElement!.style.height = height;
    }, padding);
    await expect(row).toHaveCSS("padding", padding);
    await expect
      .poll(async () => {
        const anchor = (await trigger.locator(".meta-value").boundingBox())!;
        const replacement = (await search.boundingBox())!;
        const control = (await trigger.boundingBox())!;
        const current = (await row.boundingBox())!;
        return Math.max(
          Math.abs(anchor.x - replacement.x),
          Math.abs(
            anchor.y +
              anchor.height / 2 -
              replacement.y -
              replacement.height / 2,
          ),
          Math.abs(control.height - current.height),
        );
      })
      .toBeLessThan(0.5);
  }
});

for (const theme of ["dark", "light"]) {
  test(`form controls use creation padding and preserve radius-aligned labels in ${theme}`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-descriptionlist--editable&viewMode=story&globals=theme:${theme}`,
    );
    const expected = await page.locator("dl").evaluate((root) => {
      const box = root.getBoundingClientRect();
      const term = root.querySelector("dt")!;
      const control = root.querySelector("dd button")!;
      const bounds = control.getBoundingClientRect();
      return {
        width: bounds.width,
        font: getComputedStyle(control).font,
        labelFont: getComputedStyle(term).font,
        gap: getComputedStyle(root).gap,
      };
    });
    await page.goto(
      `/iframe.html?id=components-form--default&viewMode=story&globals=theme:${theme}`,
    );
    const form = page.getByRole("form", { name: "Workspace form" });
    const actual = await form.evaluate((root) => {
      const box = root.getBoundingClientRect();
      const term = root.querySelector("label")!;
      const control = root.querySelector("input")!;
      const bounds = control.getBoundingClientRect();
      const label = term.getBoundingClientRect();
      const style = getComputedStyle(control);
      return {
        x: bounds.x - box.x,
        width: bounds.width,
        height: bounds.height,
        font: style.font,
        labelFont: getComputedStyle(term).font,
        gap: getComputedStyle(root).gap,
        padding: style.padding,
        radius: parseFloat(style.borderTopLeftRadius),
        labelInset: label.left - bounds.left,
        labelGap: bounds.top - label.bottom,
        border: style.borderWidth,
      };
    });
    expect(actual.font).toBe(expected.font);
    expect(actual.labelFont).toBe(expected.labelFont);
    expect(actual.gap).toBe(expected.gap);
    expect(actual.width).toBe(expected.width);
    expect(actual.x).toBe(0);
    expect(actual.padding).toBe("12px");
    expect(actual.radius).toBe(10);
    expect(actual.labelInset).toBe(actual.radius);
    expect(actual.labelGap).toBe(4);
    expect(actual.border).toBe("0px");
    expect(actual.height).toBe(42);
    const name = page.getByRole("textbox", { name: "Name", exact: true });
    const background = await name.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(background).not.toBe("rgba(0, 0, 0, 0)");
    expect(background).toBe(
      theme === "dark" ? "rgb(17, 17, 17)" : "rgb(251, 251, 251)",
    );
    await page.mouse.move(0, 0);
    await expect(name).toHaveCSS("background-color", background);
    await form.locator("label").first().click();
    await expect(name).toBeFocused();
    await name.fill("Updated workspace");
    await name.press("Tab");
    await expect(
      page.getByRole("textbox", { name: "State", exact: true }),
    ).toBeFocused();
    await expect(
      page.getByRole("textbox", { name: "State", exact: true }),
    ).toHaveCSS("outline-width", "2px");
    await expect(
      page.getByRole("textbox", { name: "State", exact: true }),
    ).toHaveCSS("outline-offset", "2px");

    await form.evaluate((root) =>
      root.style.setProperty("--ui-form-control-radius", "16px"),
    );
    const customized = await form.evaluate((root) => {
      const label = root.querySelector("label")!.getBoundingClientRect();
      const input = root.querySelector("input")!.getBoundingClientRect();
      return {
        inset: label.left - input.left,
        x: input.left - root.getBoundingClientRect().left,
        width: input.width,
      };
    });
    expect(customized).toEqual({ inset: 16, x: 0, width: actual.width });
  });
}

test("card forms share control heights, keep metadata first and submit native fields", async ({
  page,
}, testInfo) => {
  await page.goto("/iframe.html?id=components-form--in-card&viewMode=story");
  const priority = page.getByRole("combobox", {
    name: "Priority",
    exact: true,
  });
  const status = page.getByRole("combobox", { name: "Status", exact: true });
  const name = page.getByRole("textbox", { name: "Name", exact: true });
  const left = (await priority.boundingBox())!;
  const right = (await status.boundingBox())!;
  const input = (await name.boundingBox())!;
  expect(left.y).toBe(right.y);
  expect(left.width).toBe(right.width);
  expect(left.height).toBe(input.height);
  expect(right.x).toBeGreaterThan(left.x + left.width);
  expect(input.y).toBeGreaterThan(left.y + left.height);
  await page.screenshot({ path: testInfo.outputPath("form-in-card.png") });
  for (const trigger of [priority, status]) {
    const anchor = (await trigger.locator(".meta-value").boundingBox())!;
    const frame = (await trigger.boundingBox())!;
    await trigger.click();
    const popup = page.locator(".setting-menu");
    await expect(popup).toHaveAttribute("data-item-alignment", "selected");
    await expect(popup).toHaveCSS("border-top-left-radius", "13px");
    for (const option of await popup.getByRole("option").all()) {
      await expect(option).toHaveCSS("border-radius", "10px");
    }
    await expect(popup.locator('[data-scroll-area="viewport"]')).toHaveCSS(
      "border-radius",
      "10px",
    );
    await expect
      .poll(async () => {
        const row = (await popup
          .locator('[role="option"][aria-selected="true"]')
          .boundingBox())!;
        return Math.max(
          ...(["x", "y", "width", "height"] as const).map((key) =>
            Math.abs(row[key] - frame[key]),
          ),
        );
      })
      .toBeLessThan(0.5);
    const selected = popup.locator(
      '[aria-selected="true"] .setting-match-label',
    );
    await expect
      .poll(async () => {
        const box = (await selected.boundingBox())!;
        return Math.max(
          Math.abs(box.x - anchor.x),
          Math.abs(box.y + box.height / 2 - anchor.y - anchor.height / 2),
        );
      })
      .toBeLessThan(0.5);
    await page.keyboard.press("Escape");
  }
  await priority.click();
  await page.getByRole("option", { name: "High", exact: true }).click();
  await name.fill("Updated workspace");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByLabel("Saved values")).toContainText(
    '"name":"Updated workspace"',
  );
  await expect(page.getByLabel("Saved values")).toContainText(
    '"priority":"high"',
  );
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(name).toHaveValue("My workspace");
  await expect(priority).toHaveText("Normal");
});

test("selected form options follow live trigger padding and width changes", async ({
  page,
}, info) => {
  await page.goto("/iframe.html?id=components-form--in-card&viewMode=story");
  const trigger = page.getByRole("combobox", { name: "Priority", exact: true });
  await trigger.click();
  const selected = page.getByRole("option", { name: "Normal", exact: true });
  const assertFrame = async () => {
    await expect
      .poll(async () => {
        const a = (await trigger.boundingBox())!,
          b = (await selected.boundingBox())!;
        return Math.max(
          ...(["x", "y", "width", "height"] as const).map((key) =>
            Math.abs(a[key] - b[key]),
          ),
        );
      })
      .toBeLessThan(0.5);
  };
  await assertFrame();
  await page.getByRole("form", { name: "Item form" }).evaluate((node) => {
    node.style.width = "280px";
    node.style.setProperty("--ui-form-control-padding-block", "16px");
    node.style.setProperty("--ui-form-control-radius", "16px");
  });
  await assertFrame();
  for (const option of await page.getByRole("option").all()) {
    await expect(option).toHaveCSS("border-radius", "16px");
  }
  const other = page.locator('[role="option"][aria-selected="false"]').first();
  await other.hover();
  await other.focus();
  await expect(other).toHaveCSS("border-radius", "16px");
  await expect(page.locator(".setting-menu")).toHaveCSS(
    "border-top-left-radius",
    "19px",
  );
  await page.screenshot({ path: info.outputPath("selected-form-option.png") });
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("fractional control heights retain selected-item alignment after changing and reopening", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=components-form--in-card&viewMode=story");
  const form = page.getByRole("form", { name: "Item form" });
  const trigger = page.getByRole("combobox", { name: "Priority", exact: true });
  await trigger.click();
  await page.getByRole("option", { name: "Low", exact: true }).click();
  await form.evaluate((node) =>
    node.style.setProperty("--ui-form-control-padding-block", "11.875px"),
  );
  for (const next of ["High", "Normal", "Low"]) {
    await trigger.click();
    const popup = page.locator(".setting-menu");
    await expect(popup).toHaveAttribute("data-item-alignment", "selected");
    const selected = popup.locator('[role="option"][aria-selected="true"]');
    await expect
      .poll(async () => {
        const a = (await trigger.boundingBox())!,
          b = (await selected.boundingBox())!;
        return Math.max(
          ...(["x", "y", "width", "height"] as const).map((key) =>
            Math.abs(a[key] - b[key]),
          ),
        );
      })
      .toBeLessThan(0.1);
    await popup.getByRole("option", { name: next, exact: true }).click();
    await expect(popup).toHaveCount(0);
  }
});

for (const zoom of [1.25, 1.5]) {
  test(`selected form items reopen on the trigger at CSS zoom ${zoom}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto("/iframe.html?id=components-form--in-card&viewMode=story");
    await page.getByRole("form", { name: "Item form" }).waitFor();
    await page.evaluate((zoom) => {
      document.body.style.zoom = String(zoom);
    }, zoom);
    const trigger = page.getByRole("combobox", {
      name: "Priority",
      exact: true,
    });
    for (const next of ["Low", "High", "Normal"]) {
      await trigger.click();
      const popup = page.locator(".setting-menu");
      await expect(popup).toHaveAttribute("data-item-alignment", "selected");
      const selected = popup.locator('[role="option"][aria-selected="true"]');
      await expect
        .poll(async () => {
          const a = (await trigger.boundingBox())!,
            b = (await selected.boundingBox())!;
          return Math.max(
            ...(["x", "y", "width", "height"] as const).map((key) =>
              Math.abs(a[key] - b[key]),
            ),
          );
        })
        .toBeLessThan(0.1);
      await popup.getByRole("option", { name: next, exact: true }).click();
      await expect(popup).toHaveCount(0);
    }
  });
}

for (const [value, top, bottom] of [
  ["High", 4, 18],
  ["Low", 18, 4],
] as const) {
  test(`item alignment uses actual ${value} row extents with asymmetric padding`, async ({
    page,
  }) => {
    await page.goto("/iframe.html?id=components-form--in-card&viewMode=story");
    const trigger = page.getByRole("combobox", {
      name: "Priority",
      exact: true,
    });
    await trigger.click();
    await page.getByRole("option", { name: value, exact: true }).click();
    await trigger.evaluate(
      (node, { top, bottom }) =>
        Object.assign(node.style, {
          paddingTop: `${top}px`,
          paddingBottom: `${bottom}px`,
        }),
      { top, bottom },
    );
    await trigger.click();
    const popup = page.locator(".setting-menu");
    await expect(popup).toHaveAttribute("data-item-alignment", "selected");
    const selected = popup.getByRole("option", { name: value, exact: true });
    await expect
      .poll(async () => {
        const a = (await trigger.boundingBox())!,
          b = (await selected.boundingBox())!;
        const label = (await trigger.locator(".meta-value").boundingBox())!,
          match = (await selected
            .locator(".setting-match-label")
            .boundingBox())!;
        return Math.max(
          ...(["x", "y", "width", "height"] as const).map((key) =>
            Math.abs(a[key] - b[key]),
          ),
          Math.abs(label.y - match.y),
        );
      })
      .toBeLessThan(0.1);
    await page.keyboard.press("Escape");
  });
}
