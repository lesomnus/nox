import { SelectionFailureExample } from "../../stories/handler-failures/selections";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { useEffect, useRef, useState } from "react";
import { Switch } from "@lesomnus/nox";

const meta = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  args: {
    label: "Copy on selection",
    checked: true,
    disabled: false,
    pending: false,
    onChange: () => {},
  },
  render: function Interactive(args) {
    const [, updateArgs] = useArgs();
    return <Switch {...args} onChange={(checked) => updateArgs({ checked })} />;
  },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Off: Story = { args: { checked: false } };
export const Disabled: Story = { args: { disabled: true } };
export const TurningOn: Story = { args: { checked: false, pending: true } };
export const TurningOff: Story = { args: { checked: true, pending: true } };
export const PendingTransitions: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 24 }}>
      <Switch {...args} label="Turning on" checked={false} pending />
      <Switch {...args} label="Turning off" checked pending />
    </div>
  ),
};
export const AsyncTransition: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Keep checked at the confirmed value and set pending while applying its opposite. The reusable InkSparkle effect plays beneath the opaque thumb at a slower 2000ms duration, expanding around a fixed center 8px outside the departure edge. Ink is white when turning on and black when turning off; sparkles stay white in both directions. Pending blocks repeat requests. Update checked on success, then clear pending; on failure, just clear pending to return to the original state.",
      },
    },
  },
  render: function AsyncTransition(args) {
    const [checked, setChecked] = useState(false);
    const [pending, setPending] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);
    return (
      <Switch
        {...args}
        checked={checked}
        pending={pending}
        onChange={(next) => {
          setPending(true);
          timer.current = setTimeout(() => {
            setChecked(next);
            setPending(false);
          }, 1500);
        }}
      />
    );
  },
};

export const FailureAndRetry = {
  render: () => <SelectionFailureExample />,
};
