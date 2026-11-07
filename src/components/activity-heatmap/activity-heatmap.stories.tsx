import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ActivityHeatmap } from "@lesomnus/nox";
import docs from "../../../docs/activity-heatmap.md?raw";
const days = Array.from({ length: 84 }, (_, index) => ({
  date: new Date(Date.UTC(2026, 7, 16 + index)).toISOString().slice(0, 10),
  level: (index * 17 + (index % 3)) % 5,
  label: `Activity day ${index + 1}`,
}));
const meta = {
  title: "Components/ActivityHeatmap",
  component: ActivityHeatmap,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: docs } } },
  args: { days },
  decorators: [
    (Story) => (
      <div style={{ width: 500 }}>
        <Story />
      </div>
    ),
  ],
  render: function Example(args) {
    const [selected, setSelected] = useState("");
    return (
      <ActivityHeatmap
        {...args}
        selectedDate={selected}
        onSelect={(day) => setSelected(day.date)}
      />
    );
  },
} satisfies Meta<typeof ActivityHeatmap>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Loading: Story = { args: { loading: true, placeholder: true } };
export const Sparse: Story = { args: { days: [days[0], days[4], days[12]] } };
