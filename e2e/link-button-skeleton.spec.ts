import { expect, test } from "@playwright/test";

test("LinkButton retains keyboard navigation and a clean accessible name", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-linkbutton--default&viewMode=story",
  );
  const link = page.getByRole("link", {
    name: "Personal account",
    exact: true,
  });
  await expect(link).toHaveAttribute("href", "#account");
  await link.focus();
  await link.press("Enter");
  await expect(page).toHaveURL(/#account$/);
  await page.goto(
    "/iframe.html?id=components-linkbutton--truncated&viewMode=story",
  );
  await expect(page.getByRole("link")).toHaveAccessibleName(
    "A long account name that does not fit inside this link",
  );
});

test("Skeleton has stable dimensions and honors reduced motion", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-skeleton--default&viewMode=story",
  );
  const placeholder = page.locator(
    '#storybook-root [aria-hidden="true"][data-variant="text"]',
  );
  await expect(placeholder).toBeVisible();
  const before = (await placeholder.boundingBox())!;
  const animation = () =>
    placeholder.evaluate(
      (node) => getComputedStyle(node, "::after").animationName,
    );
  expect(await animation()).not.toBe("none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(animation).toBe("none");
  const after = (await placeholder.boundingBox())!;
  expect(after.width).toBe(before.width);
  expect(after.height).toBe(before.height);
  await page.goto("/iframe.html?id=components-skeleton--circle&viewMode=story");
  const circle = page.locator('#storybook-root [data-variant="circle"]');
  await expect(circle).toHaveCSS("width", "40px");
  await expect(circle).toHaveCSS("height", "40px");
});
