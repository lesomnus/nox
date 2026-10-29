import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";

export const fractionalChipBrowser = {
  launchOptions: {
    args: [
      "--no-zygote",
      "--disable-gpu",
      "--renderer-process-limit=1",
      "--num-raster-threads=1",
      "--font-render-hinting=none",
    ],
  },
};

export async function fractionalChipFont(page: Page) {
  const bytes = await readFile(
    new URL("./fixtures/fractional-chip.woff", import.meta.url),
  );
  await page.evaluate(async (data) => {
    const font = new FontFace(
      "ChipFractionalFixture",
      `url(data:font/woff;base64,${data})`,
    );
    document.fonts.add(await font.load());
    await document.fonts.load("14px ChipFractionalFixture", "00000");
    await document.fonts.ready;
    await new Promise(requestAnimationFrame);
  }, bytes.toString("base64"));
}
