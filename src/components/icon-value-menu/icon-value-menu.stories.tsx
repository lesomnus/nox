import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconValueMenu } from "@lesomnus/nox";

const meta = {
  title: "Components/IconValueMenu",
  component: IconValueMenu,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A decorative icon beside ValueMenu. Hovering or keyboard-focusing the value, or opening its menu, reveals one muted background behind the icon and value together. The icon stays inert and the current-value overlay remains aligned with the trigger text. Use this basic story's Controls for the wrapper API; shared disabled and search examples live under Menus/Features.",
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
    icon: (
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
    return <IconValueMenu {...args} value={value} choose={choose} />;
  },
} satisfies Meta<typeof IconValueMenu>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
