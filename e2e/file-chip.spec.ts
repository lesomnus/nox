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
