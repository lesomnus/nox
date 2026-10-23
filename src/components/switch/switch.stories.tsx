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
export const AsyncTransition: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Keep checked at the confirmed value and set pending while applying its opposite. A soft ripple stays centered at the departure edge, grows in place with a gentle deceleration, then dissipates beneath the opaque centered thumb: light when turning on and darkness when turning off. Pending blocks repeat requests. Update checked on success, then clear pending; on failure, just clear pending to return to the original state.",
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
