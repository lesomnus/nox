import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { CompactNumber, LiquidGauge, Slider } from "@lesomnus/nox";
import docs from "../../../docs/liquid-gauge.md?raw";
const meta = {
  title: "Components/LiquidGauge",
  component: LiquidGauge,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: docs } } },
  args: { value: 90, "aria-label": "Remaining usage", children: "90%" },
} satisfies Meta<typeof LiquidGauge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Levels: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16 }}>
      {[100, 99, 90, 50, 10, 0].map((value) => (
        <LiquidGauge
          key={value}
          value={value}
          aria-label={`${value}% remaining`}
        >
          <CompactNumber mode="integer" digits={3} value={value} />%
        </LiquidGauge>
      ))}
      <LiquidGauge aria-label="Not reported">—</LiquidGauge>
    </div>
  ),
};
export const Adjustable: Story = {
  render: function Example() {
    const [value, setValue] = useState(90);
    return (
      <div style={{ display: "grid", gap: 16, width: 320 }}>
        <LiquidGauge value={value} aria-label="Remaining usage">
          {value}%
        </LiquidGauge>
        <Slider
          label="Remaining"
          value={value}
          min={0}
          max={100}
          onChange={setValue}
        />
      </div>
    );
  },
};
