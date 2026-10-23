import { expect, test } from "@playwright/test";

test("labels, default selection, disabled state and Space use native radio semantics", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=components-radio--labeled&viewMode=story");
  const radio = page.getByRole("radio", { name: "Compact layout" });
  await expect(radio).not.toBeChecked();
  await page.getByText("Compact layout").click();
  await expect(radio).toBeChecked();
  await radio.press("Space");
  await expect(radio).toBeChecked();
  await page.goto("/iframe.html?id=components-radio--checked&viewMode=story");
  await expect(page.getByRole("radio")).toBeChecked();
  await page.goto(
    "/iframe.html?id=components-radio--disabled-checked&viewMode=story",
  );
  await expect(page.getByRole("radio")).toBeDisabled();
  await expect(page.getByRole("radio")).toBeChecked();
});

for (const theme of ["dark", "light"]) {
  test(`exclusive selection, arrow navigation, focus and form values work in ${theme}`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-radio--group&viewMode=story&globals=theme:${theme}`,
    );
    const group = page.getByRole("group", { name: "Layout" });
    const compact = group.getByRole("radio", { name: "Compact", exact: true });
    const comfortable = group.getByRole("radio", {
      name: "Comfortable",
      exact: true,
    });
    const spacious = group.getByRole("radio", {
      name: "Spacious",
      exact: true,
    });
    const disabled = group.getByRole("radio", {
      name: "Unavailable",
      exact: true,
    });
    await expect(compact).toBeChecked();
    await expect(disabled).toBeDisabled();
    await group.getByText("Comfortable", { exact: true }).click();
    await expect(comfortable).toBeChecked();
    await expect(compact).not.toBeChecked();
    await comfortable.focus();
    await comfortable.press("ArrowDown");
    await expect(spacious).toBeFocused();
    await expect(spacious).toBeChecked();
    await expect(comfortable).not.toBeChecked();
    const outline = await spacious.evaluate(
      (input) => getComputedStyle(input.nextElementSibling!).outlineStyle,
    );
    expect(outline).toBe("solid");
    await spacious.press("ArrowRight");
    await expect(compact).toBeFocused();
    await expect(compact).toBeChecked();
    await expect(disabled).not.toBeChecked();
    await expect(group.locator("input:checked")).toHaveCount(1);
    await expect(page.getByLabel("Selected layout")).toHaveText("compact");
    const submitted = await compact.evaluate((input) => {
      const radio = input as HTMLInputElement;
      return new FormData(radio.form!).getAll(radio.name);
    });
    expect(submitted).toEqual(["compact"]);
  });
}
