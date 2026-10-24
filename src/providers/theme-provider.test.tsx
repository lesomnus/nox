import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import {
  ThemeProvider,
  useTheme,
  createLocalStorageThemeStorage,
} from "./theme-provider";

it("renders on the server without reading browser or backend storage", () => {
  let reads = 0;
  function Value() {
    return createElement("span", null, useTheme().theme);
  }
  const html = renderToString(
    createElement(ThemeProvider, {
      storage: {
        read() {
          ++reads;
          throw new Error("client only");
        },
        write() {},
      },
      children: createElement(Value),
    }),
  );
  expect(html).toBe("<span>dark</span>");
  expect(reads).toBe(0);
  expect(createLocalStorageThemeStorage().read()).toBeNull();
});
