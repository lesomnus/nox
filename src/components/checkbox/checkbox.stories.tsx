import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Checkbox } from "@lesomnus/nox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: { "aria-label": "Select item" },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Indeterminate: Story = { args: { indeterminate: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};
export const Labeled: Story = {
  render: function Example({ disabled }) {
    const [checked, setChecked] = useState(false);
    return (
      <label>
        <Checkbox
          disabled={disabled}
          checked={checked}
          onChange={(e) => setChecked(e.currentTarget.checked)}
        />{" "}
        Include archived items
      </label>
    );
  },
};
export const DisabledLabeled: Story = {
  render: Labeled.render,
  args: { disabled: true },
};
