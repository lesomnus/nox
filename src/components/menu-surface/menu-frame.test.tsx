import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MenuFrame } from "./menu-frame";

describe("MenuFrame conditional regions", () => {
  it("omits empty conditional slots and retains the body", () => {
    const html = renderToStaticMarkup(
      <MenuFrame header={false} footer={null}>
        Choices
      </MenuFrame>,
    );
    expect(html).not.toContain("data-menu-fixed");
    expect(html).toContain("Choices");
  });
  it("accepts zero as visible fixed content", () => {
    const html = renderToStaticMarkup(
      <MenuFrame header={0} footer="Footer">
        Choices
      </MenuFrame>,
    );
    expect(html).toContain('data-menu-fixed="header">0');
    expect(html).toContain('data-menu-fixed="footer">Footer');
  });
});
