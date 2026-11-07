import type { Meta, StoryObj } from "@storybook/react-vite";
import { AnimatedDurationDisplay } from "@lesomnus/nox";

const meta = {
  title: "Components/AnimatedDurationDisplay",
  component: AnimatedDurationDisplay,
  tags: ["autodocs"],
  args: { durationMs: (6 * 1440 + 23 * 60 + 59) * 60000 },
} satisfies Meta<typeof AnimatedDurationDisplay>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Unknown: Story = { args: { durationMs: undefined } };
export const Cached: Story = { args: { animate: false } };
