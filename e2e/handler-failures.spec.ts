import { expect, test, type Page } from "@playwright/test";

const recipes: Record<string, [string, string?]> = {
  button: ["action", "kind:button"],
  bordertrailbutton: ["action", "kind:border-trail"],
  confirmbutton: ["action", "kind:confirm"],
  filechip: ["action", "kind:file-chip"],
  actionmenu: ["menu-action"],
  copybutton: ["copy-callback"],
  linkbutton: ["link-action", "kind:link"],
  switch: ["selection", "kind:switch"],
  togglebutton: ["selection", "kind:toggle"],
  checkbox: ["selection", "kind:checkbox"],
  radio: ["selection", "kind:radio"],
  segmentedcontrol: ["selection", "kind:segments"],
  valuemenu: ["menu-choice", "kind:value-menu"],
  prefixvaluemenu: ["menu-choice", "kind:prefix-menu"],
  form: ["form-submit"],
  editablevalue: ["inline-save"],
  pininput: ["code-complete"],
  datepicker: ["date-change", "control:date-picker"],
  calendar: ["date-change", "control:calendar"],
  colorpicker: ["draft-save", "kind:color"],
  slider: ["draft-save", "kind:slider"],
  settingslider: ["draft-save", "kind:setting-slider"],
  dialog: ["save-before-close", "surface:dialog"],
  drawer: ["save-before-close", "surface:drawer"],
  card: ["save-before-close", "surface:card"],
  popover: ["popover-open"],
  suggestiongrid: ["suggestion-choice"],
  table: ["row-action"],
  resizehandle: ["layout-save", "layout:resize"],
  splitlayout: ["layout-save", "layout:split"],
};
const story = (component: string, name?: string) => {
  if (component === "actionerror")
    return `/iframe.html?id=components-actionerror--${name}&viewMode=story`;
  const [recipe, args] =
    component === "button" && name === "link-failure-and-retry"
      ? ["link-action", "kind:anchor"]
      : recipes[component];
  return `/iframe.html?id=patterns-handlerfailures--${recipe}&viewMode=story&args=showRetry:true${args ? `;${args}` : ""}`;
};
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on("pageerror", (error) => messages.push(error.message));
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));
const retry = async (page: Page) => {
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Retry", exact: true }).click();
};

test("errors appear above their trigger without a retry button by default", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=patterns-handlerfailures--action&viewMode=story",
  );
  const trigger = page.getByRole("button", {
    name: "Publish report",
    exact: true,
  });
  await trigger.click();
  const alert = page.getByRole("alert");
  await expect(alert).toBeVisible();
  await expect(
    alert.getByRole("button", { name: "Retry", exact: true }),
  ).toHaveCount(0);
  const control = await trigger.boundingBox();
  const popup = await alert.boundingBox();
  expect(popup!.y + popup!.height).toBeLessThanOrEqual(control!.y);
  await trigger.click();
  await expect(page.getByRole("status")).toHaveText("Action completed");
  await expect(alert).toHaveCount(0);
});

for (const [component, label] of [
  ["button", "Publish report"],
  ["bordertrailbutton", "Publish report"],
  ["confirmbutton", "Publish report"],
  ["filechip", "report.csv"],
] as const) {
  test(`${component} catches rejection and recovers without an uncaught event`, async ({
    page,
  }) => {
    await page.goto(story(component));
    const frame = page.getByRole("region", { name: /failure example$/ });
    const bounds = await frame.boundingBox();
    await page.getByRole("button", { name: label, exact: true }).click();
    if (component === "confirmbutton")
      await page.getByRole("button", { name: "Confirm publish" }).click();
    await expect(page.getByRole("alert")).toHaveAttribute(
      "data-action-error-overlay",
      "true",
    );
    expect(await frame.boundingBox()).toEqual(bounds);
    await retry(page);
    await expect(page.getByRole("status")).toHaveText("Action completed");
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
}

test("menu failures remain visible after the menu closes and retry restores its opener", async ({
  page,
}) => {
  await page.goto(story("actionmenu"));
  const opener = page.getByRole("button", {
    name: "Report actions",
    exact: true,
  });
  await opener.click();
  await page.getByRole("menuitem", { name: "Publish report" }).click();
  await expect(page.getByRole("menu")).toHaveCount(0);
  await retry(page);
  await expect(page.getByRole("status")).toHaveText("Action completed");
  await expect(opener).toBeFocused();
});

test("a copied callback's retry does not write to the clipboard twice", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(story("copybutton"));
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "clipboard is already updated",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "report-42",
  );
  await page.evaluate(() =>
    navigator.clipboard.writeText("changed after copy"),
  );
  await retry(page);
  await expect(page.getByText("Copy recorded", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "changed after copy",
  );
});

for (const component of [
  "switch",
  "togglebutton",
  "checkbox",
  "radio",
  "segmentedcontrol",
  "valuemenu",
  "prefixvaluemenu",
]) {
  test(`${component} keeps its confirmed selection on failure and retries the requested value`, async ({
    page,
  }) => {
    await page.goto(story(component));
    const saved = page.getByLabel("Saved value", { exact: true });
    await expect(saved).toHaveText("low");
    if (component === "switch")
      await page.getByRole("switch", { name: "High quality" }).click();
    else if (component === "togglebutton")
      await page.getByRole("button", { name: "High quality" }).click();
    else if (component === "checkbox")
      await page.getByRole("checkbox", { name: "High quality" }).click();
    else if (component === "radio" || component === "segmentedcontrol")
      await page.getByRole("radio", { name: "High", exact: true }).click();
    else {
      await page
        .getByRole("combobox", { name: "Quality", exact: true })
        .click();
      await page.getByRole("option", { name: "High", exact: true }).click();
    }
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(saved).toHaveText("low");
    await retry(page);
    await expect(saved).toHaveText("high");
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
}

test("form retry keeps the draft and still runs native validation", async ({
  page,
}) => {
  await page.goto(story("form"));
  const input = page.getByRole("textbox", { name: "Workspace name" });
  await input.fill("Edited workspace");
  await input.press("Enter");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(input).toHaveValue("Edited workspace");
  await retry(page);
  await expect(page.getByLabel("Saved value")).toHaveText("Edited workspace");
  await input.fill("");
  await page.getByRole("button", { name: "Save workspace" }).click();
  expect(
    await input.evaluate(
      (node: HTMLInputElement) => node.validity.valueMissing,
    ),
  ).toBe(true);
  await expect(page.getByLabel("Saved value")).toHaveText("Edited workspace");
});

test("EditableValue keeps its editor open and its draft after save rejects", async ({
  page,
}) => {
  await page.goto(story("editablevalue"));
  await page.getByRole("button", { name: "Edit Name" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit Name" });
  const input = dialog.getByRole("textbox", { name: "Name", exact: true });
  await input.fill("Edited workspace");
  await input.press("Enter");
  await expect(dialog.getByRole("alert")).toContainText("Connection lost");
  await expect(input).toHaveValue("Edited workspace");
  await expect(page.getByLabel("Saved value")).toHaveText("My workspace");
  await expect(
    dialog.getByRole("button", { name: "Retry", exact: true }),
  ).toHaveCount(0);
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("Saved value")).toHaveText("Edited workspace");
});

test("verification failure retains the code for retry", async ({ page }) => {
  await page.goto(story("pininput"));
  const input = page.getByRole("textbox", { name: "Verification code" });
  await input.fill("123456");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(input).toHaveValue("123456");
  await retry(page);
  await expect(page.getByRole("status")).toHaveText("Code verified");
});

for (const component of ["datepicker", "calendar"]) {
  test(`${component} retains its selected date until a request succeeds`, async ({
    page,
  }) => {
    await page.goto(story(component));
    if (component === "datepicker")
      await page.getByRole("button", { name: /Schedule/ }).click();
    await page.getByRole("gridcell", { name: /October 24, 2026/ }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByLabel("Saved value")).toHaveText("2026-10-21");
    await retry(page);
    await expect(page.getByLabel("Saved value")).toHaveText("2026-10-24");
  });
}

for (const component of ["colorpicker", "slider", "settingslider"]) {
  test(`${component} preserves its edited draft through a failed save`, async ({
    page,
  }) => {
    await page.goto(story(component));
    await page.getByRole("slider").first().press("ArrowRight");
    const draft = await page.getByLabel("Draft value").textContent();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByLabel("Draft value")).toHaveText(draft!);
    await expect(page.getByLabel("Saved value")).toHaveText("Not saved");
    await retry(page);
    await expect(page.getByLabel("Saved value")).toHaveText(draft!);
  });
}

for (const component of ["dialog", "drawer", "card"]) {
  test(`${component} close failure keeps its editor available for retry`, async ({
    page,
  }) => {
    await page.goto(
      story(
        component,
        component === "dialog" ? "handler-failure" : "failure-and-retry",
      ),
    );
    const opener = page.getByRole("button", { name: "Open editor" });
    await opener.click();
    const surface =
      component === "card"
        ? page.locator(".floating-card").first()
        : page.getByRole("dialog", { name: "Edit workspace" });
    await surface.evaluate(async (node) => {
      await Promise.all(
        node
          .getAnimations({ subtree: true })
          .map((a) => a.finished.catch(() => {})),
      );
    });
    const bounds = await surface.boundingBox();
    if (component === "card")
      await page.getByRole("button", { name: "Close editor" }).click();
    else await page.keyboard.press("Escape");
    await expect(page.getByRole("alert")).toBeVisible();
    expect(await surface.boundingBox()).toEqual(bounds);
    if (component !== "card")
      await expect(surface.getByRole("alert")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeVisible();
    await retry(page);
    await expect(page.getByRole("status")).toHaveText("Workspace saved");
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toHaveCount(0);
    if (component !== "card") await expect(opener).toBeFocused();
  });
}

for (const component of ["resizehandle", "splitlayout"]) {
  test(`${component} preserves local layout on persistence failure`, async ({
    page,
  }) => {
    await page.goto(story(component));
    const separator = page.getByRole("separator").first();
    await separator.press("ArrowRight");
    const value = await separator.getAttribute("aria-valuenow");
    await page.getByRole("button", { name: "Save layout" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(separator).toHaveAttribute("aria-valuenow", value!);
    await retry(page);
    await expect(page.getByLabel("Saved value")).not.toHaveText("Not saved");
  });
}

test("popover loading failure leaves its trigger usable and feedback survives closing", async ({
  page,
}) => {
  await page.goto(story("popover"));
  await page.getByRole("button", { name: "Workspace details" }).focus();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Workspace details" }).blur();
  await retry(page);
  await expect(page.getByRole("status")).toHaveText("Details loaded");
});

test("a failed row action keeps the row and retry removes it", async ({
  page,
}) => {
  await page.goto(story("table"));
  await page.getByRole("button", { name: "Delete report" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Quarterly report" }),
  ).toBeVisible();
  await retry(page);
  await expect(page.getByRole("status")).toHaveText("Report deleted");
  await expect(
    page.getByRole("cell", { name: "Quarterly report" }),
  ).toHaveCount(0);
});

test("suggestion acceptance can fail and retry the chosen item", async ({
  page,
}) => {
  await page.goto(story("suggestiongrid"));
  await page.getByRole("gridcell", { name: "Dashboard" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Saved value")).toHaveText("Starter");
  await retry(page);
  await expect(page.getByLabel("Saved value")).toHaveText("Dashboard");
});

test("synchronous failures are handled locally and the error surface translates", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=patterns-handlerfailures--lifecycle&viewMode=story",
  );
  await page.getByLabel("Handler mode").selectOption("sync");
  await page.getByRole("button", { name: "Run twice" }).click();
  await expect(page.getByRole("alert")).toContainText("Synchronous failure");
  await expect(page.getByLabel("Result")).toHaveText("false");
  await page.getByRole("button", { name: "Clear feedback" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.goto(story("actionerror", "localized"));
  await expect(page.getByRole("alert")).toContainText("작업에 실패했습니다");
  await expect(page.getByRole("button", { name: "재시도" })).toBeVisible();
});

test("same-frame duplicates, latest callbacks, unmount and late settlements remain isolated", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=patterns-handlerfailures--lifecycle&viewMode=story",
  );
  await page.getByRole("button", { name: "Update handler" }).click();
  await page.getByRole("button", { name: "Run twice" }).click();
  await expect(page.getByLabel("Calls")).toHaveText("payload:2");
  await expect(page.getByLabel("Pending")).toHaveText("true");
  await page.getByRole("button", { name: "Unmount action" }).click();
  await page.getByRole("button", { name: "Mount action" }).click();
  await page.getByRole("button", { name: "Run twice" }).click();
  await page.getByRole("button", { name: "Reject oldest" }).click();
  await expect(page.getByLabel("Result")).toHaveText("false");
  await expect(page.getByLabel("Pending")).toHaveText("true");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Resolve oldest" }).click();
  await expect(page.getByLabel("Pending")).toHaveText("false");
  await expect(page.getByLabel("Result")).toHaveText("true");
  await expect(page.getByLabel("Stable callback")).toHaveText("true");
});

test("rejected non-Errors and thenables are normalized and reset clears feedback", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=patterns-handlerfailures--lifecycle&viewMode=story",
  );
  await page.getByLabel("Handler mode").selectOption("non-error");
  await page.getByRole("button", { name: "Run twice" }).click();
  await expect(page.getByRole("alert")).toContainText("Cause: null");
  await expect(page.getByLabel("Result")).toHaveText("false");
  await page.getByRole("button", { name: "Clear feedback" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByLabel("Handler mode").selectOption("thenable");
  await page.getByRole("button", { name: "Run twice" }).click();
  await expect(page.getByRole("alert")).toContainText("Thenable failure");
  await expect(page.getByLabel("Pending")).toHaveText("false");
});

for (const [component, name] of [
  ["linkbutton", "failure-and-retry"],
  ["button", "link-failure-and-retry"],
]) {
  test(`${component} link callback failures stay local and retry succeeds`, async ({
    page,
  }) => {
    await page.goto(story(component, name));
    const link = page.getByRole("link", { name: "Load report preview" });
    await expect(link).toHaveAttribute("href", "#report-preview");
    await link.press("Enter");
    await expect(page.getByRole("alert")).toContainText("Could not load");
    expect(new URL(page.url()).hash).toBe("");
    await retry(page);
    await expect(page.getByRole("status")).toHaveText("Action completed");
    await expect(link).toBeFocused();
  });
}

test("error feedback fits narrow themes and keeps retry focus while pending", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 360, height: 640 });
  for (const theme of ["dark", "light"]) {
    await page.goto(`${story("button")}&globals=theme:${theme}`);
    const button = page.getByRole("button", { name: "Publish report" });
    await button.evaluate((node) =>
      node.setAttribute("aria-describedby", "existing-help"),
    );
    const bounds = await button.boundingBox();
    await button.click();
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    expect(await button.boundingBox()).toEqual(bounds);
    const appearance = await alert.evaluate((node) => {
      const css = getComputedStyle(node);
      return {
        position: css.position,
        border: css.borderTopWidth,
        blur: css.backdropFilter,
        background: css.backgroundColor,
        color: css.color,
      };
    });
    expect(appearance.position).toBe("fixed");
    expect(parseFloat(appearance.border)).toBeGreaterThan(0);
    expect(appearance.blur).toMatch(/^blur\([1-9]/);
    expect(appearance.background).toMatch(/(?:\/|,)\s*0\.\d+\s*\)/);
    expect(appearance.color).toBe(
      await button.evaluate((node) => getComputedStyle(node).color),
    );
    const errorId = await alert.getAttribute("id");
    expect(
      (await button.getAttribute("aria-describedby"))?.split(" "),
    ).toContain(errorId);
    await page.screenshot({ path: info.outputPath(`error-${theme}.png`) });
    const texture = await page.addStyleTag({
      content: `body { background-image: repeating-linear-gradient(90deg, transparent 0 2px, color-mix(in srgb, var(--ui-shade-237) 30%, transparent) 2px 3px) !important; }`,
    });
    await page.screenshot({
      path: info.outputPath(`error-glass-${theme}.png`),
    });
    await texture.evaluate((node) => node.parentNode?.removeChild(node));
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(360);
    const again = page.getByRole("button", { name: "Retry", exact: true });
    await again.click();
    await expect(again).toHaveAttribute("aria-busy", "true");
    await expect(again).toBeFocused();
    await expect(page.getByRole("alert")).toHaveAttribute("aria-busy", "true");
    await expect(page.getByRole("status")).toHaveText("Action completed");
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute("aria-describedby", "existing-help");
  }
});
