import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioMenu, Popover } from "@lesomnus/nox";
function Preview({
  disabledLast = false,
  withIcons = false,
  many = false,
  disabled = false,
}: {
  disabledLast?: boolean;
  withIcons?: boolean;
  many?: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(many ? "option-02" : "oldest");
  const [applies, setApplies] = useState(0);
  const options = many
    ? Array.from({ length: 40 }, (_, i) => ({
        value: `option-${String(i + 1).padStart(2, "0")}`,
        label: `Option ${String(i + 1).padStart(2, "0")}`,
        disabled: false,
      }))
    : [
        { value: "newest", label: "Newest first", disabled: false },
        { value: "oldest", label: "Oldest first", disabled: false },
        { value: "name", label: "Name", disabled: disabledLast },
      ];
  return (
    <div style={{ display: "grid", gap: "var(--ui-space)" }}>
      <RadioMenu
        label="Sort order"
        value={value}
        disabled={disabled}
        options={options.map((option) => ({
          ...option,
          icon: withIcons ? (
            <Popover content={option.label}>
              <span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="8" cy="8" r="3" />
                </svg>
              </span>
            </Popover>
          ) : undefined,
        }))}
        choose={(next) => {
          setValue(next);
          setApplies((count) => count + 1);
        }}
      />
      <output aria-label="Selected value">{value}</output>
      <output aria-label="Apply count">{applies}</output>
    </div>
  );
}
const meta = {
  title: "Components/RadioMenu",
  component: Preview,
  parameters: {
    docs: {
      description: {
        component:
          "Single-selection counterpart to CheckboxMenu. Both use the same surface, indicator styling, rows, spacing, icon slots, content-only press feedback and draft/close lifecycle. Opening focuses the selected enabled item. Arrow keys/Home/End move focus; Space/Enter choose one radio without closing. Closing via trigger, Escape, outside click or focus departure commits once if changed. The indicator stays fixed during press feedback. ValueMenu remains the alternative for a value-aligned listbox.",
      },
    },
  },
} satisfies Meta<typeof Preview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithIcons: Story = { args: { withIcons: true } };
export const DisabledOption: Story = { args: { disabledLast: true } };
export const LongList: Story = { args: { many: true } };
export const Disabled: Story = { args: { disabled: true } };
