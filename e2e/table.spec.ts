import { expect, test } from "@playwright/test";

const story = (name: string) =>
  `/iframe.html?id=components-table--${name}&viewMode=story`;

test("native table exposes its caption, row headings and footer", async ({
  page,
}) => {
  await page.goto(story("default"));
  const table = page.getByRole("table", { name: "Project sessions" });
  await expect(table.getByRole("columnheader")).toHaveText([
    "Name",
    "Account",
    "State",
    "Tasks",
  ]);
  await expect(table.getByRole("rowheader")).toHaveText([
    "Design system",
    "API integration",
    "Documentation",
    "Release preparation",
    "Total tasks",
  ]);
  await expect(table.locator("tfoot")).toContainText("28");
});

test("caller-owned selection supports keyboard and mixed select-all without turning rows into click targets", async ({
  page,
}) => {
  await page.goto(story("selectable"));
  const all = page.getByRole("checkbox", { name: "Select all sessions" });
  const first = page.getByRole("checkbox", { name: "Select Design system" });
  await first.focus();
  await first.press("Space");
  await expect(first).toBeChecked();
  await expect(all).toBeChecked({ indeterminate: true });
  await expect(
    page.getByRole("row", { name: /Design system/ }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel("Selected sessions")).toHaveText("1 selected");
  await page.getByRole("rowheader", { name: "API integration" }).click();
  await expect(page.getByLabel("Selected sessions")).toHaveText("1 selected");
  await all.focus();
  await all.press("Space");
  await expect(page.getByLabel("Selected sessions")).toHaveText("4 selected");
  await all.press("Space");
  await expect(page.getByLabel("Selected sessions")).toHaveText("0 selected");
});

test("bounded table keeps headings visible while its scrollbar moves rows", async ({
  page,
}) => {
  await page.goto(story("scrolling"));
  const region = page.getByRole("region", { name: "Session list" });
  const header = region.locator("thead");
  const before = (await header.boundingBox())!;
  const bar = page.getByRole("scrollbar", { name: "Scroll sessions" });
  await bar.focus();
  await bar.press("End");
  await expect
    .poll(async () => Number(await bar.getAttribute("aria-valuenow")))
    .toBeGreaterThan(0);
  await expect
    .poll(async () => (await header.boundingBox())!.y)
    .toBeCloseTo(before.y, 0);
  await expect(
    region.getByRole("cell", { name: "Release preparation 32", exact: true }),
  ).toBeInViewport();
});

test("narrow table scrolls horizontally inside its region", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 640 });
  await page.goto(story("horizontal-overflow"));
  const viewport = page.locator('[data-scroll-area="viewport"]');
  const sizes = await viewport.evaluate((node) => ({
    width: node.clientWidth,
    scroll: node.scrollWidth,
  }));
  expect(sizes.scroll).toBeGreaterThan(sizes.width);
  await viewport.evaluate((node) => {
    node.scrollLeft = node.scrollWidth;
  });
  await expect
    .poll(() => viewport.evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
