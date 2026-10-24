import { expect, test, type Page } from "@playwright/test";
const url = (name = "default") =>
  `/iframe.html?id=providers-themeprovider--${name}&viewMode=story`;
async function theme(page: Page, value: string) {
  await expect(page.locator("html")).toHaveAttribute("data-ui-theme", value);
  await expect(page.locator("html")).toHaveAttribute("data-theme", value);
  await expect(page.locator("html")).toHaveCSS("color-scheme", value);
  await expect(page.getByLabel("Resolved theme", { exact: true })).toHaveText(
    value,
  );
}

test("defaults to localStorage, survives reload and reports a ready StrictMode lifecycle", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("nox.theme") === null)
      localStorage.setItem("nox.theme", "light");
  });
  await page.goto(url());
  await theme(page, "light");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await theme(page, "dark");
  expect(await page.evaluate(() => localStorage.getItem("nox.theme"))).toBe(
    "dark",
  );
  await page.reload();
  await theme(page, "dark");
  await expect(
    page.getByLabel("Theme storage status", { exact: true }),
  ).toHaveText("Ready");
});

test("system preference follows OS changes without replacing the saved preference", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(url());
  await page.getByRole("button", { name: "System", exact: true }).click();
  await theme(page, "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await theme(page, "light");
  expect(await page.evaluate(() => localStorage.getItem("nox.theme"))).toBe(
    "system",
  );
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await theme(page, "dark");
});

test("default backend synchronizes tabs and storage clear resets to the fallback", async ({
  page,
}) => {
  await page.goto(url());
  await expect(
    page.getByLabel("Theme storage status", { exact: true }),
  ).toHaveText("Ready");
  const other = await page.context().newPage();
  await other.goto(url());
  await expect(
    other.getByLabel("Theme storage status", { exact: true }),
  ).toHaveText("Ready");
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await theme(other, "light");
  await other.evaluate(() => localStorage.clear());
  await theme(page, "dark");
  expect(
    await page.evaluate(() => localStorage.getItem("nox.theme")),
  ).toBeNull();
  await other.close();
});

test("injected backend is authoritative and reacts to external changes without using localStorage", async ({
  page,
}) => {
  await page.goto(url("custom-storage"));
  await theme(page, "light");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await theme(page, "dark");
  await expect(
    page.getByLabel("Custom stored preference", { exact: true }),
  ).toHaveText("dark");
  expect(
    await page.evaluate(() => localStorage.getItem("nox.theme")),
  ).toBeNull();
  await page
    .getByRole("button", { name: "External change", exact: true })
    .click();
  await theme(page, "light");
});

test("async hydration cannot undo a user selection and unmount restores root appearance", async ({
  page,
}) => {
  await page.goto(url("async-storage"));
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(
    page.getByLabel("Custom stored preference", { exact: true }),
  ).toHaveText("dark");
  await expect(
    page.getByLabel("Theme storage status", { exact: true }),
  ).toHaveText("Ready");
  await theme(page, "dark");
  await page.goto(url("unmountable"));
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await theme(page, "light");
  await page
    .getByRole("button", { name: "Unmount provider", exact: true })
    .click();
  await page.evaluate(() => {
    document.documentElement.dataset.uiTheme = "light";
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
  });
  await page
    .getByRole("button", { name: "Mount provider", exact: true })
    .click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await theme(page, "dark");
  await page
    .getByRole("button", { name: "Unmount provider", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-ui-theme", "light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
});
