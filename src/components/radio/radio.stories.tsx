import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useState } from "react";
import { Radio } from "@lesomnus/nox";

const meta = {
  title: "Components/Radio",
  component: Radio,
  tags: ["autodocs"],
  args: { "aria-label": "Select option" },
  parameters: {
    docs: {
      description: {
        component:
          "Native radio control styled like Checkbox. Wrap it in a label or supply aria-label. Radios sharing a name form an exclusive group with native arrow-key navigation and form submission. Supports checked/onChange, defaultChecked, disabled, required and input refs. className targets the outer control. Override --ui-radio-size to change its size; it defaults to the Checkbox size.",
      },
    },
  },
} satisfies Meta<typeof Radio>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};
export const Labeled: Story = {
  render: function Example() {
    const id = useId();
    return (
      <label htmlFor={id}>
        <Radio id={id} name={id} value="compact" /> Compact layout
      </label>
    );
  },
};
export const Group: Story = {
  render: function Example() {
    const name = useId();
    const [value, setValue] = useState("compact");
    return (
      <form>
        <fieldset style={{ display: "grid", gap: 12, border: 0, padding: 0 }}>
          <legend>Layout</legend>
          {[
            ["compact", "Compact"],
            ["comfortable", "Comfortable"],
            ["spacious", "Spacious"],
            ["unavailable", "Unavailable"],
          ].map(([option, label]) => (
            <label key={option}>
              <Radio
                name={name}
                value={option}
                checked={value === option}
                onChange={(event) => setValue(event.currentTarget.value)}
                disabled={option === "unavailable"}
                required
              />{" "}
              {label}
            </label>
          ))}
          <output aria-label="Selected layout">{value}</output>
        </fieldset>
      </form>
    );
  },
};
