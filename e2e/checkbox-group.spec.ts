import { expect, test } from "@playwright/test";

test("checkbox group preserves independent selection and supports mixed select-all", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=components-checkbox--group&viewMode=story");
  const group = page.getByRole("group", { name: "Notifications" });
  const all = group.getByRole("checkbox", { name: "Select all", exact: true });
  const email = group.getByRole("checkbox", {
    name: "Email updates",
    exact: true,
  });
  const desktop = group.getByRole("checkbox", {
    name: "Desktop notifications",
    exact: true,
  });
  const digest = group.getByRole("checkbox", {
    name: "Weekly digest",
    exact: true,
  });
  await expect(all).toBeChecked({ indeterminate: true });
  await expect(email).toBeChecked();
  await desktop.check();
  await expect(email).toBeChecked();
  await expect(digest).not.toBeChecked();
  await all.check();
  await expect(all).not.toBeChecked({ indeterminate: true });
  await expect(email).toBeChecked();
  await expect(desktop).toBeChecked();
  await expect(digest).toBeChecked();
  await expect(
    group.getByRole("checkbox", { name: "Unavailable", exact: true }),
  ).toBeDisabled();
  expect(
    await email.evaluate((node) => {
      const input = node as HTMLInputElement;
      return new FormData(input.form!).getAll(input.name);
    }),
  ).toEqual(["email", "desktop", "digest"]);
  await all.uncheck();
  await expect(group.locator("input:checked")).toHaveCount(0);
  await expect(page.getByLabel("Selected notifications")).toHaveText("None");
});
