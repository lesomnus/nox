import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { FileChip, fileChipText } from "./file-chip";
import { SegmentedControl } from "../segmented-control/segmented-control";
import docs from "../../../docs/file-chip.md?raw";

const meta = {
  title: "Components/FileChip",
  component: FileChip,
  tags: ["autodocs"],
  args: { children: "report.md" },
  parameters: { docs: { description: { component: docs } } },
} satisfies Meta<typeof FileChip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Link: Story = {
  args: { as: "a", href: "#report", children: "workspace/report.md" },
};
export const Action: Story = {
  render: function Action() {
    const [opened, setOpened] = useState(false);
    return (
      <>
        <FileChip as="button" onClick={() => setOpened(true)}>
          report.md
        </FileChip>
        <output>{opened ? "Opened report" : "Choose a file"}</output>
      </>
    );
  },
};
export const Loading: Story = {
  args: { as: "button", loading: true, children: "archive.zip · Uploading…" },
};
export const Disabled: Story = {
  args: { as: "button", disabled: true },
};
export const CustomLeading: Story = {
  render: function CustomLeading() {
    const [mode, setMode] = useState("text");
    return (
      <FileChip
        pixelLayout
        role="group"
        aria-label="File with leading control"
        leading={
          <SegmentedControl
            size="inline"
            iconOnly
            label="Delivery mode"
            value={mode}
            onChange={setMode}
            options={[
              {
                value: "text",
                label: "Text",
                icon: (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M4 5h16M12 5v14M8 19h8" />
                  </svg>
                ),
              },
              {
                value: "file",
                label: "File",
                icon: (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M14 3H6v18h14V9ZM14 3v6h6" />
                  </svg>
                ),
              },
            ]}
          />
        }
      >
        1.23K
      </FileChip>
    );
  },
};
export const InlineText: Story = {
  render: () => (
    <p style={{ fontFamily: "system-ui", fontSize: 16, lineHeight: 1.5 }}>
      Read{" "}
      <FileChip as="a" href="#report">
        <code>report.md</code>
      </FileChip>{" "}
      before continuing.
    </p>
  ),
};
export const TextLayout: Story = {
  render: () => (
    <div style={{ fontFamily: "var(--ui-font-mono)", lineHeight: 1.5 }}>
      <p>
        Before <FileChip textLayout>[Text 1.23K]</FileChip> after.
      </p>
      <p data-native-reference style={{ whiteSpace: "break-spaces" }}>
        Before {fileChipText("[Text 1.23K]")} after.
      </p>
    </div>
  ),
};
