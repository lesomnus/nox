import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActivityDots } from "@lesomnus/nox";
import docs from "../../../docs/activity-dots.md?raw";
const meta = {
  title: "Components/ActivityDots",
  component: ActivityDots,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: docs } } },
  args: { seed: 42 },
} satisfies Meta<typeof ActivityDots>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const IndependentPhases: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24 }}>
      {[1, 2, 3, 4, 5, 6].map((seed) => (
        <ActivityDots key={seed} seed={seed} />
      ))}
    </div>
  ),
};
export const CustomPalette: Story = {
  args: { palette: ["#e49b7c", "#bfa7e8", "#8bd1bf"], step: 300 },
};
