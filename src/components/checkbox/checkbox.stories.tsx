import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useState } from "react";
import { Checkbox } from "@lesomnus/nox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: { "aria-label": "Select item" },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Indeterminate: Story = { args: { indeterminate: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};
export const Labeled: Story = {
  render: function Example({ disabled }) {
    const [checked, setChecked] = useState(false);
    return (
      <label>
        <Checkbox
          disabled={disabled}
          checked={checked}
          onChange={(e) => setChecked(e.currentTarget.checked)}
        />{" "}
        Include archived items
      </label>
    );
  },
};
export const DisabledLabeled: Story = {
  render: Labeled.render,
  args: { disabled: true },
};
export const Group: Story = {
  render: function Example() {
    const name = useId();
    const [selected, setSelected] = useState(["email"]);
    const options = [
      ["email", "Email updates"],
      ["desktop", "Desktop notifications"],
      ["digest", "Weekly digest"],
    ];
    const all = selected.length === options.length;
    return (
      <form>
        <fieldset style={{ display: "grid", gap: 12, border: 0, padding: 0 }}>
          <legend>Notifications</legend>
          <label>
            <Checkbox
              checked={all}
              indeterminate={selected.length > 0 && !all}
              onChange={(event) =>
                setSelected(
                  event.currentTarget.checked
                    ? options.map(([value]) => value)
                    : [],
                )
              }
            />{" "}
            Select all
          </label>
          {options.map(([value, label]) => (
            <label key={value}>
              <Checkbox
                name={name}
                value={value}
                checked={selected.includes(value)}
                onChange={(event) => {
                  const checked = event.currentTarget.checked;
                  setSelected((current) =>
                    checked
                      ? [...current, value]
                      : current.filter((item) => item !== value),
                  );
                }}
              />{" "}
              {label}
            </label>
          ))}
          <label>
            <Checkbox name={name} value="unavailable" disabled /> Unavailable
          </label>
          <output aria-label="Selected notifications">
            {selected.length ? selected.join(", ") : "None"}
          </output>
        </fieldset>
      </form>
    );
  },
};
