import { expect, test } from "@playwright/test";

test("checkboxes retain native labels, keyboard input, mixed and disabled states", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-checkbox--labeled&viewMode=story",
  );
  const labeled = page.getByRole("checkbox", {
    name: "Include archived items",
  });
  await expect(labeled).not.toBeChecked();
  await page.getByText("Include archived items").click();
  await expect(labeled).toBeChecked();
  await labeled.focus();
  await labeled.press("Space");
  await expect(labeled).not.toBeChecked();
  await page.goto(
    "/iframe.html?id=components-checkbox--indeterminate&viewMode=story",
  );
  const mixed = page.getByRole("checkbox", { name: "Select item" });
  await expect(mixed).toBeChecked({ indeterminate: true });
  await mixed.press("Space");
  await expect(mixed).toBeChecked();
  await expect(mixed).not.toBeChecked({ indeterminate: true });
  await page.goto(
    "/iframe.html?id=components-checkbox--disabled-checked&viewMode=story",
  );
  await expect(mixed).toBeDisabled();
  await expect(mixed).toBeChecked();
});

test("copy reports success and copies the full identifier without changing its layout", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          document.documentElement.dataset.copied = value;
        },
      },
    });
  });
  await page.goto(
    "/iframe.html?id=components-identifiervalue--default&viewMode=story",
  );
  const prefix = page.getByText("1a2b3c4", { exact: true });
  const original = await prefix.boundingBox();
  await prefix.hover();
  const hint = page.getByRole("tooltip", {
    name: "1a2b3c4d-5e6f-7788-9900-aabbccddeeff",
  });
  await expect(hint).toBeVisible();
  expect(await prefix.boundingBox()).toEqual(original);
  await page.getByRole("button", { name: "Copy", exact: true }).press("Enter");
  await expect(page.locator("html")).toHaveAttribute(
    "data-copied",
    "1a2b3c4d-5e6f-7788-9900-aabbccddeeff",
  );
  await expect(page.getByRole("status")).toHaveText("Copied");
  expect(await prefix.boundingBox()).toEqual(original);
  await page.goto(
    "/iframe.html?id=components-identifiervalue--without-copy&viewMode=story",
  );
  await expect(page.getByRole("button")).toHaveCount(0);
});

test("clipboard denial is visible rather than reporting success", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new DOMException("Clipboard denied", "NotAllowedError");
        },
      },
    });
  });
  await page.goto(
    "/iframe.html?id=components-copybutton--default&viewMode=story",
  );
  const copy = page.getByRole("button", { name: "Copy", exact: true });
  await copy.click();
  await expect(page.getByRole("status")).toHaveText("Copy failed");
  await expect(copy).toBeEnabled();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await expect(page.getByRole("tooltip")).toHaveText("Copy failed");
});

test.describe("absolute timestamps in the viewer's timezone", () => {
  test.use({ timezoneId: "America/New_York" });
  test("uses the date's DST offset and a machine-readable UTC time", async ({
    page,
  }) => {
    await page.goto(
      "/iframe.html?id=components-datetime--local-offset&viewMode=story",
    );
    const time = page.locator("time");
    await expect(time).toHaveText("2026-10-19T22:38:19-04:00");
    await expect(time).toHaveAttribute("datetime", "2026-10-20T02:38:19.000Z");
    const separator = time.getByText("-", { exact: true }).first();
    expect(
      await separator.evaluate((el) => getComputedStyle(el).color),
    ).not.toEqual(await time.evaluate((el) => getComputedStyle(el).color));
    await page.goto(
      "/iframe.html?id=components-datetime--winter&viewMode=story",
    );
    await expect(time).toHaveText("2026-01-19T21:38:19-05:00");
    await page.goto(
      "/iframe.html?id=components-datetime--invalid&viewMode=story",
    );
    await expect(time).toHaveCount(0);
    await expect(
      page.getByRole("img", { name: "Invalid date", exact: true }),
    ).toHaveText("xxxx-xx-xxTxx:xx:xx+xx:xx");
    await page.goto(
      "/iframe.html?id=components-datetime--missing&viewMode=story",
    );
    await expect(
      page.getByRole("img", { name: "Date unavailable", exact: true }),
    ).toHaveText("····-··-··T··:··:··+··:··");
  });
});

test("description fields share compact typography and keyboard-accessible portaled help", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-descriptionlist--default&viewMode=story",
  );
  const list = page.locator("dl");
  await expect(list.locator("dt")).toHaveCount(6);
  await expect(
    list
      .locator("div")
      .filter({ has: page.locator("dt", { hasText: "Count" }) })
      .locator("dd"),
  ).toHaveText("0");
  const name = list.locator("dt").filter({ hasText: "Name" });
  const created = list.locator("dt").filter({ hasText: "Created" });
  expect((await name.boundingBox())!.x).toBeGreaterThan(
    (await created.boundingBox())!.x,
  );
  expect((await name.boundingBox())!.y).toBeLessThan(
    (await created.boundingBox())!.y,
  );
  expect(await name.evaluate((el) => getComputedStyle(el).fontFamily)).toEqual(
    await created.evaluate((el) => getComputedStyle(el).fontFamily),
  );
  const help = page.getByRole("img", { name: "About Status" }).locator("..");
  await help.focus();
  await expect(
    page.getByRole("tooltip", { name: "The workspace is available for use." }),
  ).toBeVisible();
  await help.press("Escape");
  await expect(
    page.getByRole("tooltip", { name: "The workspace is available for use." }),
  ).toHaveCount(0);
  await page.goto(
    "/iframe.html?id=components-descriptionlist--editable&viewMode=story",
  );
  await page.getByRole("button", { name: "Edit Name" }).click();
  const input = page.getByRole("textbox", { name: "Name" });
  await input.fill("Updated name");
  await input.press("Enter");
  await expect(page.getByRole("button", { name: "Edit Name" })).toHaveText(
    "Updated name",
  );
});

test("navigation header stays fixed and only the scroll body reveals its handle", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=layout-navigationpanel--default&viewMode=story",
  );
  const panel = page.getByRole("complementary", { name: "Documents" });
  const header = panel.locator("header");
  const viewport = panel.locator('[data-scroll-area="viewport"]');
  const handle = panel.locator('[data-scroll-area="handle"]');
  const before = await header.boundingBox();
  await header.hover();
  await expect(handle).toHaveCSS("opacity", "0");
  await viewport.hover();
  await expect(handle).toHaveCSS("opacity", "0.7");
  await viewport.evaluate((el) => (el.scrollTop = el.scrollHeight));
  await expect
    .poll(() => viewport.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  expect(await header.boundingBox()).toEqual(before);
  await expect(
    panel.getByRole("button", { name: "Add document" }),
  ).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Document 24", exact: true }),
  ).toBeInViewport();
  await page.goto(
    "/iframe.html?id=layout-navigationpanel--settings&viewMode=story",
  );
  await page.getByRole("button", { name: "Editor", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Editor", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "General", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("record browser composes selection and editing without application services", async ({
  page,
}) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (
      request.resourceType() === "fetch" ||
      request.resourceType() === "websocket"
    )
      requests.push(request.url());
  });
  await page.goto(
    "/iframe.html?id=integration-recordbrowser--default&viewMode=story",
  );
  const nav = page.getByRole("complementary", { name: "Workspaces" });
  await nav.getByRole("button", { name: "Documentation", exact: true }).click();
  await expect(
    nav.getByRole("button", { name: "Documentation", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Edit Name" }).click();
  await page
    .getByRole("textbox", { name: "Name" })
    .fill("Updated documentation");
  await page.getByRole("textbox", { name: "Name" }).press("Enter");
  await expect(
    nav.getByRole("button", { name: "Updated documentation", exact: true }),
  ).toBeVisible();
  const checkbox = page.getByRole("checkbox", {
    name: "Archived",
    exact: true,
  });
  await checkbox.press("Space");
  await expect(checkbox).toBeChecked();
  expect(requests.filter((url) => /\/cxz[./]/.test(url))).toEqual([]);
  expect(errors).toEqual([]);
});

test("new surfaces adapt to the shared light palette", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=components-checkbox--checked&viewMode=story&globals=theme:light",
  );
  const box = page.getByRole("checkbox").locator("+ span");
  await expect(box).toHaveCSS("background-color", "rgb(18, 18, 18)");
  await page.goto(
    "/iframe.html?id=layout-navigationpanel--default&viewMode=story&globals=theme:light",
  );
  await expect(page.locator('[data-scroll-area="root"]')).toHaveCSS(
    "background-color",
    "rgb(244, 244, 244)",
  );
});
