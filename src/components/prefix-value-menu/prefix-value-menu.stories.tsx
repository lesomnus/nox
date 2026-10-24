import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PrefixValueMenu } from "@lesomnus/nox";

const meta = {
  title: "Components/PrefixValueMenu",
  component: PrefixValueMenu,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Text, an icon or other leading React content beside ValueMenu. Hovering or keyboard-focusing the value, or opening its menu, reveals one muted background behind the prefix and value together. The prefix stays inert and the current-value overlay remains aligned with the trigger text. label supplies the accessible selector name. Shared disabled and search examples live under Menus/Features.",
      },
    },
  },
  args: {
    label: "Effort",
    value: "medium",
    options: ["low", "medium", "high"].map((value) => ({
      value,
      label: value,
    })),
    choose: () => {},
    prefix: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 18a9 9 0 1 1 16 0M12 14l4-6" />
      </svg>
    ),
  },
  render: function Example(args) {
    const [value, choose] = useState(args.value);
    return <PrefixValueMenu {...args} value={value} choose={choose} />;
  },
} satisfies Meta<typeof PrefixValueMenu>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const TextPrefix: Story = {
  args: { prefix: "Effort" },
};
