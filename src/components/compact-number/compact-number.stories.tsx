import type { Meta, StoryObj } from "@storybook/react-vite";
import { CompactNumber } from "@lesomnus/nox";

const meta = {
  title: "Components/CompactNumber",
  component: CompactNumber,
  tags: ["autodocs"],
  args: { value: 1 },
  argTypes: {
    muted: { control: "boolean" },
    baseUnit: { control: "text", if: { arg: "mode", neq: "integer" } },
    digits: {
      control: { type: "number", min: 1, step: 1 },
      if: { arg: "mode", eq: "integer" },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A fixed-width numeric display. Compact mode selects a unit that keeps as much information as fits; units are slightly dimmed and padding zeroes are darker. A displayed zero uses the intermediate unit color for its final digit. Set muted to apply that same color to significant digits of any value, in either mode; padding stays darker. Integer mode omits the unit cell for ordinary counters and accepts an integer-only digits prop (four cells by default). Small fractional values use m, µ and n so costs do not disappear as zero. The accessible label retains the original value.",
      },
    },
  },
} satisfies Meta<typeof CompactNumber>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Single: Story = {};
export const Integer: Story = { args: { value: 1, mode: "integer" } };
export const DetailedMillions: Story = { args: { value: 1_234_567 } };
export const Zero: Story = { args: { value: 0 } };
export const IntegerZero: Story = {
  args: { value: 0, mode: "integer", digits: 3 },
};
export const Muted: Story = { args: { value: 1230, muted: true } };
export const MutedInteger: Story = {
  args: { value: 7, mode: "integer", digits: 3, muted: true },
};
export const Thousands: Story = { args: { value: 1230 } };
export const Bytes: Story = {
  args: { value: 55, baseUnit: "B", label: "55 bytes" },
};
export const Millions: Story = { args: { value: 1_230_000 } };
export const SmallCost: Story = {
  args: { value: 0.0001, label: "Cost: $0.0001" },
};

export const ThreeDigits: Story = {
  args: { value: 7, mode: "integer", digits: 3 },
};
export const ThreeDigitOverflow: Story = {
  args: { value: 1234, mode: "integer", digits: 3 },
};
