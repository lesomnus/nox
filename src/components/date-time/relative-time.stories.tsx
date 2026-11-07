import type { Meta, StoryObj } from "@storybook/react-vite";
import { RelativeTime } from "@lesomnus/nox";
const now = Date.parse("2026-11-07T12:00:00Z");
const meta = {
  title: "Components/RelativeTime",
  component: RelativeTime,
  tags: ["autodocs"],
  args: { value: now - 5 * 60_000, now, locale: "en" },
} satisfies Meta<typeof RelativeTime>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Compact: Story = { args: { compact: true } };
export const Future: Story = {
  args: { compact: true, value: now + 2 * 3_600_000 },
};
export const Korean: Story = { args: { compact: true, locale: "ko" } };
export const Units: Story = {
  args: { compact: true },
  render: (args) => (
    <div style={{ display: "grid", gap: 12 }}>
      {[
        0,
        60_000,
        3_600_000,
        86_400_000,
        7 * 86_400_000,
        30 * 86_400_000,
        365 * 86_400_000,
      ].map((elapsed) => (
        <RelativeTime key={elapsed} {...args} value={now - elapsed} />
      ))}
    </div>
  ),
};
