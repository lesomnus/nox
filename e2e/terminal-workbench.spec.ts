import { test, expect } from "@playwright/test";

test("portable terminal workbench preserves renderer state across docking without app providers", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=components-terminalworkbench--portable&viewMode=story",
  );
  const panel = page.getByRole("region", { name: "Workspace terminal" });
  await expect(panel).toContainText("Renderer preview");
  const input1 = page.getByRole("textbox", { name: "Input terminal-1" });
  await input1.fill("keep-first-draft");
  await panel.getByRole("button", { name: "New terminal" }).click();
  const input2 = page.getByRole("textbox", { name: "Input terminal-2" });
  await input2.fill("keep-second-history");
  await input2.press("Enter");
  await input2.fill("keep-second-draft");
  const slot = panel.getByRole("tabpanel");
  const bounds = (await slot.boundingBox())!;
  await panel.locator('[data-terminal-tab="terminal-2"]').dragTo(slot, {
    targetPosition: { x: bounds.width - 8, y: bounds.height / 2 },
  });
  await expect(panel.locator("[data-terminal-group]")).toHaveCount(2);
  await expect(input1).toHaveValue("keep-first-draft");
  await expect(input2).toHaveValue("keep-second-draft");
  await expect(panel).toContainText("keep-second-history");
  await expect(
    panel.getByRole("button", { name: "Terminal layout" }),
  ).toHaveCount(0);

  // Form an aligned four-way crossing, then detach its continuous ancestor.
  // Reparenting the split tree must not remount any session renderer.
  for (const id of [3, 4]) {
    const source = id === 3 ? input2 : input1;
    await source.click();
    const group = panel.locator("[data-terminal-group]").filter({
      has: page.locator(`[data-terminal-tab="terminal-${id === 3 ? 2 : 1}"]`),
    });
    await group.getByRole("button", { name: "New terminal" }).click();
    const input = page.getByRole("textbox", { name: `Input terminal-${id}` });
    await input.fill(`keep-draft-${id}`);
    const target = group.getByRole("tabpanel");
    const bounds = (await target.boundingBox())!;
    await panel.locator(`[data-terminal-tab="terminal-${id}"]`).dragTo(target, {
      targetPosition: { x: bounds.width / 2, y: bounds.height - 2 },
    });
  }
  await expect(panel.locator("[data-terminal-group]")).toHaveCount(4);
  const separator = panel.locator(
    '[data-split-id][aria-orientation="vertical"]',
  );
  const wall = (await separator.boundingBox())!;
  await separator.click({
    position: { x: wall.width / 2, y: wall.height / 4 },
  });
  await page.mouse.down({ clickCount: 2 });
  await page.mouse.move(
    wall.x + wall.width / 2 + 30,
    wall.y + wall.height / 4,
    { steps: 4 },
  );
  await page.mouse.up({ clickCount: 2 });
  await expect(
    panel.locator('[data-split-id][aria-orientation="vertical"]'),
  ).toHaveCount(2);
  await expect(input1).toHaveValue("keep-first-draft");
  await expect(input2).toHaveValue("keep-second-draft");
  await expect(panel).toContainText("keep-second-history");
  for (const id of [3, 4])
    await expect(
      page.getByRole("textbox", { name: `Input terminal-${id}` }),
    ).toHaveValue(`keep-draft-${id}`);
  await panel.getByRole("button", { name: "Hide terminal" }).click();
  await expect(panel).toBeHidden();
  await page.getByRole("button", { name: "Toggle terminal" }).click();
  await expect(input2).toHaveValue("keep-second-draft");
});
