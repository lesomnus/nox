import { expect, test } from "@playwright/test";

for (const theme of ["dark", "light"]) {
  test(`Card gives nested Form text fields and value menus the same background in ${theme}`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-card--form&viewMode=story&globals=theme:${theme}`,
    );
    const input = page.getByRole("textbox", { name: "Alias", exact: true });
    const select = page.getByRole("combobox", { name: "Agent", exact: true });
    await expect(input).toBeVisible();
    const color = await input.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await expect(select).toHaveCSS("background-color", color);
    const bodyColor = await page
      .locator(".card-body")
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(color).not.toBe(bodyColor);
    await select.click();
    await page.getByRole("option", { name: "Claude", exact: true }).click();
    await expect(select).toHaveText("Claude");
  });
}

for (const theme of ["dark", "light"]) {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`revealed Card blurs throughout entrance in ${theme} / ${reducedMotion}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion });
      await page.goto(
        `/iframe.html?id=components-card--revealed-glass&viewMode=story&globals=theme:${theme}`,
      );
      const card = page.locator("section.floating-card");
      await expect(card).toBeVisible();
      for (const phase of [0.15, 0.4, 0.7, 1]) {
        const count = await card.evaluate((node, phase) => {
          // Freeze glass and content at the same phase; otherwise screenshots
          // could differ because time advanced instead of because blur works.
          node.style.setProperty("--ui-menu-reveal-duration", "10s");
          const animations = node.getAnimations({ subtree: true });
          for (const animation of animations) {
            animation.pause();
            animation.currentTime =
              Number(animation.effect!.getTiming().duration) * phase;
          }
          return animations.length;
        }, phase);
        expect(count).toBe(reducedMotion === "reduce" ? 0 : 3);
        const header = (await card.locator(".card-heading").boundingBox())!;
        const clip = {
          x: Math.ceil(header.x + 24),
          y: Math.ceil(header.y + 4),
          width: 160,
          height: 6,
        };
        const blurred = await page.screenshot({ clip });
        const override = await page.addStyleTag({
          content:
            "[data-reveal-from]::before { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }",
        });
        const sharp = await page.screenshot({ clip });
        await override.evaluate((node) => {
          node.parentNode?.removeChild(node);
        });
        expect(blurred.equals(sharp), `visible blur at ${phase * 100}%`).toBe(
          false,
        );
      }
    });
  }
}

for (const theme of ["dark", "light"]) {
  test(`headerless Card keeps matching top and horizontal body insets in ${theme}`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-card--headerless&viewMode=story&globals=theme:${theme}`,
    );
    const card = page.locator("section.floating-card");
    await expect(card.locator(".card-heading")).toHaveCount(0);
    await expect(card.locator(".card-body")).toHaveCSS("padding", "0px");
    const gaps = await card.evaluate((node) => {
      const outer = node.getBoundingClientRect();
      const inner = node.querySelector(".card-body")!.getBoundingClientRect();
      const css = getComputedStyle(node);
      return {
        top: inner.top - outer.top - parseFloat(css.borderTopWidth),
        left: inner.left - outer.left - parseFloat(css.borderLeftWidth),
        right: outer.right - inner.right - parseFloat(css.borderRightWidth),
      };
    });
    expect(gaps.top).toBeGreaterThan(0);
    expect(gaps.top).toBeCloseTo(gaps.left, 5);
    expect(gaps.top).toBeCloseTo(gaps.right, 5);
  });
}

for (const theme of ["dark", "light"]) {
  test(`Card owns its surface and preserves action variants in ${theme}`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=components-card--default&viewMode=story&globals=theme:${theme}`,
    );
    const card = page.locator("section.floating-card");
    await expect(card).toBeVisible();
    await expect(card.locator(".card-heading")).toHaveText(
      "Workspace information",
    );
    await expect(card.locator(".card-body")).toHaveCSS(
      "background-color",
      theme === "dark" ? "rgb(28, 28, 28)" : "rgb(244, 244, 244)",
    );
    await expect(card).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(
      card.getByRole("button", { name: "Save", exact: true }),
    ).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const geometry = await card.evaluate((node) => {
      const body = node.querySelector<HTMLElement>(".card-body")!;
      const outer = node.getBoundingClientRect(),
        inner = body.getBoundingClientRect();
      return {
        gap:
          inner.x -
          outer.x -
          parseFloat(getComputedStyle(node).borderLeftWidth),
        radius: parseFloat(getComputedStyle(body).borderTopLeftRadius),
      };
    });
    expect(geometry.gap).toBe(2);
    expect(geometry.radius).toBeGreaterThan(0);
  });
}

for (const story of ["filled", "revealed-filled"]) {
  test(`Card ${story} fills a sized parent with compact padding and a scrolling body`, async ({
    page,
  }) => {
    await page.goto(`/iframe.html?id=components-card--${story}&viewMode=story`);
    const card = page.locator("section.floating-card");
    await expect(card).toBeVisible();
    if (story === "revealed-filled")
      await expect(card.locator('[data-enter-effect="reveal"]')).toHaveCSS(
        "mask-image",
        "none",
      );
    expect((await card.boundingBox())!.height).toBe(280);
    await expect(card.locator(".card-body")).toHaveCSS("padding", "4px");
    const header = card.locator(".card-heading"),
      footer = card.locator(".card-footer");
    const before = [await header.boundingBox(), await footer.boundingBox()];
    const viewport = card.locator('[data-scroll-area="viewport"]');
    expect(
      await viewport.evaluate((node) => node.scrollHeight > node.clientHeight),
    ).toBe(true);
    await viewport.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    expect([await header.boundingBox(), await footer.boundingBox()]).toEqual(
      before,
    );
  });
}
