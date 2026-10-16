import type { Meta, StoryObj } from "@storybook/react-vite";
import { DurationDisplay } from "./duration-display";
const meta = {
  title: "Components/DurationDisplay",
  component: DurationDisplay,
  tags: ["autodocs"],
  args: { durationMs: (6 * 1440 + 23 * 60 + 59) * 60000 },
} satisfies Meta<typeof DurationDisplay>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Days: Story = {};
export const Minutes: Story = { args: { durationMs: 5 * 60000 } };
export const Zero: Story = { args: { durationMs: 0 } };
export const Unknown: Story = { args: { durationMs: undefined } };
export const Overflow: Story = { args: { durationMs: 100 * 86400000 } };
