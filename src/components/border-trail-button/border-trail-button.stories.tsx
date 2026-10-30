import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { BorderTrailButton, Button } from "@lesomnus/nox";
import docs from "../../../docs/border-trail-button.md?raw";

const meta = {
  title: "Components/BorderTrailButton",
  component: BorderTrailButton,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: docs } } },
  args: {
    children: "Background jobs",
    active: true,
    segments: 3,
    effect: "sparkle",
  },
  argTypes: { segments: { control: { type: "number", min: 0, step: 1 } } },
} satisfies Meta<typeof BorderTrailButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SingleColor: Story = {
  args: { segments: 5, colors: ["var(--ui-brand-color)"] },
};
export const ManySegments: Story = {
  args: { segments: 12, children: "Twelve independent trails" },
};
export const CustomSegments: Story = {
  args: {
    children: "Independent colors and speeds",
    segments: [
      { color: "#78d9ef", length: 0.16, duration: 15000, offset: 0 },
      { color: "#c58bef", length: 0.08, duration: 11000, offset: 0.35 },
      { color: "#d9ff30", length: 0.06, duration: 19000, offset: 0.7 },
    ],
  },
};
export const Inactive: Story = { args: { active: false } };
export const TrackOnly: Story = { args: { segments: 0 } };
export const Disabled: Story = { args: { disabled: true } };
export const WithInk: Story = { args: { effect: "sparkle" } };
export const Sheen: Story = {
  args: {
    children: "Traveling light",
    effect: "none",
    segments: [{ color: "#3d79a6", length: 0.55, offset: 0 }],
    sheen: { duration: 4000, length: 0.12, strength: 0.85 },
    style: { width: 220 },
  },
};
export const Progressive: Story = {
  render: function Progressive(args) {
    const [value, setValue] = useState(1);
    return (
      <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
        <BorderTrailButton
          {...args}
          effect="none"
          aria-label="Progressive work"
          active={value > 0}
          progress={{ value, perSegment: 8 }}
          sheen
          style={{ width: 180 }}
        >
          {value} jobs
        </BorderTrailButton>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button effect="none" onClick={() => setValue((n) => n + 1)}>
            Add unit
          </Button>
          <Button
            effect="none"
            disabled={!value}
            onClick={() => setValue((n) => Math.max(0, n - 1))}
          >
            Remove unit
          </Button>
          <Button effect="none" onClick={() => setValue(8)}>
            Fill first color
          </Button>
          <Button effect="none" onClick={() => setValue(9)}>
            Start next color
          </Button>
          <Button effect="none" onClick={() => setValue(17)}>
            Third color
          </Button>
        </div>
      </div>
    );
  },
};
export const Shapes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <BorderTrailButton {...args} variant="toolbar" aria-label="Three jobs">
        3
      </BorderTrailButton>
      <BorderTrailButton {...args} style={{ borderRadius: 999, width: 180 }}>
        Rounded
      </BorderTrailButton>
      <BorderTrailButton
        {...args}
        style={{ borderRadius: "3px 16px 8px 12px" }}
      >
        Different corners
      </BorderTrailButton>
    </div>
  ),
};
export const Interaction: Story = {
  args: { effect: "none" },
  render: function Interaction(args) {
    const ref = useRef<HTMLButtonElement>(null);
    const [count, setCount] = useState(3);
    const [clicks, setClicks] = useState(0);
    return (
      <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
        <BorderTrailButton
          {...args}
          ref={ref}
          aria-label="Job count"
          active={count > 0}
          segments={Math.max(1, count)}
          style={{ minWidth: 110 }}
          onClick={() => setClicks((n) => n + 1)}
        >
          {count} jobs
        </BorderTrailButton>
        <output>Clicks: {clicks}</output>
        <div style={{ display: "flex", gap: 8 }}>
          <Button effect="none" onClick={() => setCount((n) => n + 1)}>
            Add segment
          </Button>
          <Button
            effect="none"
            disabled={!count}
            onClick={() => setCount((n) => n - 1)}
          >
            Remove segment
          </Button>
          <Button effect="none" onClick={() => ref.current?.focus()}>
            Focus trails
          </Button>
        </div>
      </div>
    );
  },
};
