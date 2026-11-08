import { expect, test } from "@playwright/test";

for (const scale of [1, 1.25, 1.5, 2]) {
  test.describe(`menu frame at display scale ${scale}`, () => {
    test("top and left gaps match in the rendered pixels after positioning and resize", async ({
      playwright,
      baseURL,
    }, info) => {
      // Exercise native display scaling, not just a rescaled emulated screenshot.
      const browser = await playwright.chromium.launch({
        args: [
          "--no-zygote",
          "--disable-gpu",
          "--renderer-process-limit=1",
          "--num-raster-threads=1",
          `--force-device-scale-factor=${scale}`,
        ],
      });
      const page = await browser.newPage({ baseURL, deviceScaleFactor: scale });
      try {
        await page.goto(
          "/iframe.html?id=components-actionmenu--more&viewMode=story",
        );
        const popup = page.locator(".action-menu-popup");
        const row = popup.getByRole("menuitem", {
          name: "Details",
          exact: true,
        });

        // Odd viewport dimensions give the centered trigger fractional coordinates.
        for (const width of [1200, 1201]) {
          await page.setViewportSize({ width, height: 901 });
          await page.getByRole("button", { name: "More", exact: true }).click();
          await row.hover();
          await popup.evaluate(async (node) => {
            await Promise.all(
              node
                .getAnimations({ subtree: true })
                .map((animation) => animation.finished.catch(() => {})),
            );
          });
          await expect
            .poll(() =>
              popup.evaluate((node) => {
                const r = node.getBoundingClientRect();
                const dpr = window.devicePixelRatio;
                const error = (n: number) => Math.abs(n - Math.round(n));
                return Math.max(error(r.x * dpr), error(r.y * dpr));
              }),
            )
            .toBeLessThan(0.03);
          const geometry = await row.evaluate((node) => {
            const frame = node.closest(".action-menu-popup")!;
            const box = (el: Element) => {
              const r = el.getBoundingClientRect();
              return { x: r.x, y: r.y, width: r.width, height: r.height };
            };
            const rgb = (color: string) =>
              [...color.matchAll(/[\d.]+/g)]
                .slice(0, 3)
                .map((m) => Number(m[0]));
            return {
              frame: box(frame),
              row: box(node),
              border: rgb(getComputedStyle(frame).borderLeftColor),
              fill: rgb(getComputedStyle(node).backgroundColor),
            };
          });
          const insetX = (geometry.row.x - geometry.frame.x) * scale;
          const insetY = (geometry.row.y - geometry.frame.y) * scale;
          expect(insetX).toBeCloseTo(insetY, 2);
          expect(Math.abs(insetX - Math.round(insetX))).toBeLessThan(0.03);

          const screenshot = await page.screenshot({
            path: info.outputPath(`menu-${width}.png`),
          });
          const gaps = await page.evaluate(
            async ({ png, geometry, scale }) => {
              const image = new Image();
              image.src = `data:image/png;base64,${png}`;
              await image.decode();
              const canvas = new OffscreenCanvas(image.width, image.height);
              const ctx = canvas.getContext("2d")!;
              ctx.drawImage(image, 0, 0);
              const sample = (x: number, y: number) =>
                Array.from(ctx.getImageData(x, y, 1, 1).data).slice(0, 3);
              const nearest = (
                axis: "x" | "y",
                start: number,
                end: number,
                fixed: number,
                color: number[],
              ) => {
                let position = start;
                let distance = Infinity;
                for (let n = start; n <= end; n++) {
                  const rgb =
                    axis === "x" ? sample(n, fixed) : sample(fixed, n);
                  const d = rgb.reduce(
                    (sum, v, i) => sum + (v - color[i]) ** 2,
                    0,
                  );
                  if (d < distance) {
                    position = n;
                    distance = d;
                  }
                }
                return position;
              };
              const gap = (axis: "x" | "y") => {
                const start = Math.round(geometry.frame[axis] * scale);
                const edge = Math.round(geometry.row[axis] * scale);
                const fixed = Math.floor(
                  (axis === "x"
                    ? geometry.row.y + geometry.row.height / 2
                    : geometry.row.x + geometry.row.width / 2) * scale,
                );
                const border = nearest(
                  axis,
                  start - 1,
                  start + 2,
                  fixed,
                  geometry.border,
                );
                const fill = nearest(
                  axis,
                  edge - 1,
                  edge + 2,
                  fixed,
                  geometry.fill,
                );
                return fill - border;
              };
              return { left: gap("x"), top: gap("y") };
            },
            { png: screenshot.toString("base64"), geometry, scale },
          );
          expect(gaps.left).toBeGreaterThan(0);
          expect(gaps.top, JSON.stringify({ gaps, geometry })).toBe(gaps.left);
          await page.keyboard.press("Escape");
        }
      } finally {
        await browser.close();
      }
    });
  });
}
