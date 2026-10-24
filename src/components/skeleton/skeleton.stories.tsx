import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "@lesomnus/nox";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  args: { width: 180 },
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Rectangle: Story = { args: { variant: "rect", height: 90 } };
export const Circle: Story = { args: { variant: "circle", width: 40 } };
export const Static: Story = { args: { animated: false } };
export const Profile: Story = {
  render: () => (
    <div
      role="status"
      aria-label="Loading profile"
      style={{ display: "flex", alignItems: "center", gap: 12, width: 280 }}
    >
      <Skeleton variant="circle" width={40} style={{ flex: "none" }} />
      <div style={{ display: "grid", gap: 8, flex: 1 }}>
        <Skeleton width="65%" />
        <Skeleton />
      </div>
    </div>
  ),
};
