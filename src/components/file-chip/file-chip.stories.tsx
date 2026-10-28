import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { FileChip, fileChipText } from "./file-chip";
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
