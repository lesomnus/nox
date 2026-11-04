import type { Meta, StoryObj } from "@storybook/react-vite";
import { CompactNumber } from "@lesomnus/nox";
import { Button } from "../button/button";
import { useState } from "react";

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
          "A fixed-width numeric display. Compact mode uses the canonical SI magnitude with up to three significant digits, truncating extra decimals: 6547000 → 6.54M and 12345 → 12.3K. Units are slightly dimmed and padding zeroes are darker. A displayed zero uses the intermediate unit color for its final digit. Set muted to apply that same color to significant digits of any value, in either mode; padding stays darker. Integer mode omits the unit cell for ordinary counters and accepts an integer-only digits prop (four cells by default). Small fractional values use m, µ and n so costs do not disappear as zero. The accessible label retains the original value.",
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
export const ReadableMillions: Story = { args: { value: 6_547_000 } };
export const ReadableThousands: Story = { args: { value: 12_345 } };
export const LoadingSlide: Story = {
  args: {
    motion: "slide",
    maxSlideSteps: 4,
    duration: 600,
    characterDelay: 40,
  },
  render: function LoadingSlide(args) {
    const [value, setValue] = useState(NaN);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <CompactNumber
          {...args}
          value={value}
          label={Number.isFinite(value) ? String(value) : "Loading value"}
        />
        <Button onClick={() => setValue(9_999_999)}>Load value</Button>
        <Button onClick={() => setValue(6_547_000)}>Update value</Button>
        <Button onClick={() => setValue(NaN)}>Clear value</Button>
      </div>
    );
  },
};
export const InitialSlide: Story = {
  args: {
    value: 6_547_000,
    motion: "slide",
    animateInitial: true,
    maxSlideSteps: 4,
    duration: 600,
    characterDelay: 100,
  },
};
export const ContinuousSlide: Story = {
  args: {
    mode: "integer",
    digits: 1,
    motion: "slide",
    maxSlideSteps: 4,
    duration: 600,
  },
  render: function ContinuousSlide(args) {
    const [value, setValue] = useState(0);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <CompactNumber {...args} value={value} />
        <Button onClick={() => setValue(2)}>Two</Button>
        <Button onClick={() => setValue(0)}>Zero</Button>
      </div>
    );
  },
};
export const InitialIntegerSlide: Story = {
  args: {
    value: 9,
    mode: "integer",
    digits: 3,
    motion: "slide",
    animateInitial: true,
    maxSlideSteps: 4,
    duration: 600,
    characterDelay: 100,
  },
};
export const SmallCost: Story = {
  args: { value: 0.0001, label: "Cost: $0.0001" },
};

export const ThreeDigits: Story = {
  args: { value: 7, mode: "integer", digits: 3 },
};
export const ThreeDigitOverflow: Story = {
  args: { value: 1234, mode: "integer", digits: 3 },
};
