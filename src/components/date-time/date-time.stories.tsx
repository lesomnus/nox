import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateTime } from "@lesomnus/nox";
import { useEffect, useState } from "react";
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
function LiveDate(args: React.ComponentProps<typeof DateTime>) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <DateTime {...args} value={now} />;
}
export const Sliding: Story = {
  args: { motion: "slide", direction: "down" },
  render: (args) => <LiveDate {...args} />,
};
export const Flipping: Story = {
  args: { motion: "flip" },
  render: (args) => <LiveDate {...args} />,
};
