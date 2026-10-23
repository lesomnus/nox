import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateTime } from "@lesomnus/nox";
const meta = {
  title: "Components/DateTime",
  component: DateTime,
  tags: ["autodocs"],
  args: { value: "2026-10-20T02:38:19Z" },
} satisfies Meta<typeof DateTime>;
export default meta;
type Story = StoryObj<typeof meta>;
export const LocalOffset: Story = {};
export const Winter: Story = { args: { value: "2026-01-20T02:38:19Z" } };
export const Missing: Story = {
  args: { value: undefined },
  parameters: {
    docs: {
      description: {
        story:
          "Missing dates show a dot in every numeric position, preserving the timestamp layout.",
      },
    },
  },
};
export const Invalid: Story = {
  args: { value: "invalid" },
  parameters: {
    docs: {
      description: {
        story:
          "Invalid dates show x in every numeric position, preserving the timestamp layout.",
      },
    },
  },
};
