import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { ValueMenu } from "./value-menu";

test("custom value labels keep their string identity for selection and accessibility", () => {
  const html = renderToStaticMarkup(
    <ValueMenu
      label="Revision"
      value="4"
      options={[
        { value: "4", label: "Revision r4", description: "Created today" },
      ]}
      choose={() => {}}
      renderLabel={(option) => (
        <strong data-revision-label>
          {option.value}
          <small>{option.description}</small>
        </strong>
      )}
    />,
  );
  expect(html).toContain('role="combobox"');
  expect(html).toContain('aria-label="Revision"');
  expect(html).toContain('title="Revision r4"');
  expect(html).toContain('data-value="4"');
  expect(html).toContain(
    '<strong data-revision-label="true">4<small>Created today</small></strong>',
  );
});

test("ordinary labels retain the default primary and secondary text", () => {
  const html = renderToStaticMarkup(
    <ValueMenu
      label="Revision"
      value="4"
      options={[
        { value: "4", label: "Revision r4", description: "Created today" },
      ]}
      choose={() => {}}
    />,
  );
  expect(html).toContain("Revision r4");
  expect(html).toContain("Created today");
  expect(html).not.toContain("data-revision-label");
});
