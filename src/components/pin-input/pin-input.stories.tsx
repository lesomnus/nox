import { useId, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, PinInput } from "@lesomnus/nox";

const meta = {
  title: "Components/PinInput",
  component: PinInput,
  tags: ["autodocs"],
  args: {
    label: "Verification code",
    length: 6,
    mode: "numeric",
    disabled: false,
  },
  argTypes: {
    mode: { control: "select", options: ["numeric", "alphanumeric"] },
    length: { control: { type: "number", min: 1, max: 16 } },
  },
  parameters: {
    docs: {
      description: {
        component:
          "One accessible native input presented as character slots. Typing advances the visible caret; click a slot to replace it, use arrows/Home/End, or paste a complete formatted code from any slot. Numeric and uppercase alphanumeric modes support OTP autofill. groups={[4,4]} displays a device code with a visual separator while keeping one unformatted value.",
      },
    },
  },
  render: function Interactive(args) {
    const id = useId();
    const [value, setValue] = useState(args.value ?? args.defaultValue ?? "");
    const [completed, setCompleted] = useState(0);
    return (
      <div style={{ display: "grid", gap: 12, maxWidth: "100%" }}>
        <label htmlFor={id} style={{ fontSize: 13 }}>
          {args.label}
        </label>
        <PinInput
          {...args}
          id={id}
          value={value}
          onChange={(next) => {
            setValue(next);
            args.onChange?.(next);
          }}
          onComplete={(next) => {
            setCompleted((count) => count + 1);
            args.onComplete?.(next);
          }}
        />
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            fontSize: 12,
            color: "var(--ui-muted)",
          }}
        >
          <output aria-label="Current code">
            {args.masked && value ? "Hidden" : value || "Empty"}
          </output>
          <span>
            Completed: <output aria-label="Completed codes">{completed}</output>
          </span>
          <Button effect="none" onClick={() => setValue("")}>
            Clear
          </Button>
        </div>
      </div>
    );
  },
} satisfies Meta<typeof PinInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const FourDigits: Story = { args: { length: 4, label: "PIN" } };
export const DeviceCode: Story = {
  args: { label: "Device code", mode: "alphanumeric", groups: [4, 4] },
};
export const GroupedOtp: Story = {
  args: { groups: [3, 3], label: "Verification code" },
};
export const Masked: Story = {
  args: { length: 4, masked: true, value: "1234", label: "Secret PIN" },
};
export const Invalid: Story = {
  args: { "aria-invalid": true, "aria-describedby": "pin-error" },
  decorators: [
    (Story) => (
      <div style={{ display: "grid", gap: 8 }}>
        <Story />
        <span
          id="pin-error"
          style={{ fontSize: 12, color: "var(--ui-pin-input-error-color)" }}
        >
          That code was not accepted. Try again.
        </span>
      </div>
    ),
  ],
};
export const Disabled: Story = { args: { disabled: true, value: "123456" } };
export const ReadOnly: Story = { args: { readOnly: true, value: "123456" } };
export const NativeForm: Story = {
  args: { label: "Device code", mode: "alphanumeric", groups: [4, 4] },
  render: function NativeForm(args) {
    const id = useId();
    const ref = useRef<HTMLInputElement>(null);
    const [submitted, setSubmitted] = useState("");
    return (
      <form
        style={{ display: "grid", gap: 12 }}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(
            String(new FormData(event.currentTarget).get("device_code")),
          );
        }}
      >
        <label htmlFor={id}>{args.label}</label>
        <PinInput
          {...args}
          id={id}
          ref={ref}
          name="device_code"
          defaultValue="AB"
          required
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="submit" effect="none">
            Submit
          </Button>
          <Button type="reset" effect="none">
            Reset
          </Button>
          <Button
            type="button"
            effect="none"
            onClick={() => ref.current?.focus()}
          >
            Focus code
          </Button>
        </div>
        <output aria-label="Submitted code">
          {submitted || "Not submitted"}
        </output>
      </form>
    );
  },
};
