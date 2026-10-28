import { expect, test } from "@playwright/test";

test("leading controls retain keyboard semantics and a stable outer frame", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-filechip--custom-leading&viewMode=story",
  );
  const chip = page.getByRole("group", { name: "File with leading control" });
  const text = chip.getByRole("radio", { name: "Text", exact: true });
  await expect(text).toBeChecked();
  const leading = await chip.evaluate((el) => {
    const control = el.querySelector('[role="radiogroup"]')!;
    return {
      offset:
        control.getBoundingClientRect().left - el.getBoundingClientRect().left,
      border: parseFloat(
        getComputedStyle(el).getPropertyValue("--ui-file-chip-border-width"),
      ),
      padding: getComputedStyle(control).paddingLeft,
    };
  });
  expect(leading.offset).toBe(leading.border);
  expect(leading.padding).toBe("1px");
  const control = chip.getByRole("radiogroup");
  await expect(chip.locator("[data-file-chip-control]")).toHaveCSS(
    "width",
    "34px",
  );
  await expect(control).toHaveCSS("width", "34px");
  await expect(control).toHaveCSS("height", "18px");
  const frame = (await chip.boundingBox())!;
  const bounds = (await control.boundingBox())!;
  expect(bounds.y).toBeGreaterThanOrEqual(frame.y + leading.border);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(
    frame.y + frame.height - leading.border,
  );
  await expect(control.locator(".segment-indicator")).toHaveCSS(
    "width",
    "16px",
  );
  for (const label of await control.locator("label").all()) {
    await expect(label).toHaveCSS("width", "16px");
    await expect(label).toHaveCSS("min-width", "16px");
    await expect(label).toHaveCSS("max-width", "16px");
    await expect(label).toHaveCSS("height", "16px");
    await expect(label).toHaveCSS("min-height", "16px");
    await expect(label).toHaveCSS("max-height", "16px");
  }
  const prefix = chip.locator("[data-file-chip-prefix]");
  await prefix.evaluate((el) => (el.style.width = "38.49px"));
  const widths = await chip.locator("[data-file-chip-control]").evaluate((el) =>
    [el, ...el.querySelectorAll("*")].map((node) => ({
      tag: node.tagName,
      width: getComputedStyle(node).width,
    })),
  );
  for (const item of widths) {
    const width = parseFloat(item.width);
    if (Number.isFinite(width))
      expect(Number.isInteger(width), JSON.stringify(item)).toBe(true);
  }
  await expect(chip.locator("[data-file-chip-control]")).toHaveCSS(
    "width",
    "34px",
  );
  await prefix.evaluate((el) => el.style.removeProperty("width"));
  const before = await chip.boundingBox();
  await text.focus();
  await text.press("ArrowRight");
  await expect(
    chip.getByRole("radio", { name: "File", exact: true }),
  ).toBeChecked();
  expect(await chip.boundingBox()).toEqual(before);
  expect(await chip.evaluate((el) => el.tagName)).toBe("SPAN");
});

test("file links inherit body typography and the shared transparent frame", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-filechip--inline-text&viewMode=story",
  );
  const chip = page.getByRole("link", { name: "report.md" });
  const style = await chip.evaluate((el) => {
    const c = getComputedStyle(el),
      p = getComputedStyle(el.parentElement!);
    return {
      chip: [c.color, c.fontFamily, c.fontSize, c.lineHeight],
      body: [p.color, p.fontFamily, p.fontSize, p.lineHeight],
      background: c.backgroundColor,
      border: c.borderTopColor,
      divider: getComputedStyle(el, "::after").backgroundColor,
      icon: getComputedStyle(el, "::before").maskImage,
      decoration: c.textDecorationLine,
    };
  });
  expect(style.chip).toEqual(style.body);
  expect(style.background).toBe("rgba(0, 0, 0, 0)");
  expect(style.divider).toBe(style.border);
  expect(style.icon).not.toBe("none");
  expect(style.decoration).toBe("none");
});

test("actions retain native keyboard activation and disabled behavior", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=components-filechip--action&viewMode=story");
  const chip = page.getByRole("button", { name: "report.md" });
  await chip.focus();
  await chip.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Opened report");
  await page.goto(
    "/iframe.html?id=components-filechip--disabled&viewMode=story",
  );
  await expect(page.getByRole("button", { name: "report.md" })).toBeDisabled();
});

test("text layout matches literal editor advances and loading respects reduced motion", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-filechip--text-layout&viewMode=story",
  );
  const rows = page.locator("#storybook-root p");
  await expect(rows).toHaveCount(2);
  const widths = await rows.evaluateAll((nodes) =>
    nodes.map((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect().width;
    }),
  );
  expect(Math.abs(widths[0] - widths[1])).toBeLessThan(0.125);
  await page.goto(
    "/iframe.html?id=components-filechip--loading&viewMode=story",
  );
  const chip = page.getByRole("button");
  await expect(chip).toHaveAttribute("aria-busy", "true");
  const activity = chip.locator("[data-file-chip-activity]");
  await expect(activity).toHaveCSS("animation-play-state", "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(activity).toHaveCSS("animation-name", "none");
});
