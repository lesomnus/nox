import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CheckboxMenu, Popover } from "@lesomnus/nox";
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
  const [value, setValue] = useState(many ? ["option-01"] : ["info", "error"]);
  const [applies, setApplies] = useState(0);
  return (
    <div style={{ display: "grid", gap: "var(--ui-space)" }}>
      <CheckboxMenu
        label="Log level"
        allLabel="All levels"
        disabled={disabled}
        options={(many
          ? Array.from({ length: 40 }, (_, i) => ({
              value: `option-${String(i + 1).padStart(2, "0")}`,
              label: `Option ${String(i + 1).padStart(2, "0")}`,
              disabled: false,
            }))
          : [
              { value: "info", label: "Information", disabled: false },
              { value: "warn", label: "Warnings", disabled: false },
              { value: "error", label: "Errors", disabled: disabledLast },
            ]
        ).map((option) => ({
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
        value={value}
        choose={(next) => {
          setValue(next);
          setApplies((count) => count + 1);
        }}
      />
      <output aria-label="Selected values">{value.join(", ") || "None"}</output>
      <output aria-label="Apply count">{applies}</output>
    </div>
  );
}
const meta = {
  title: "Components/CheckboxMenu",
  component: Preview,
  parameters: {
    docs: {
      description: {
        component:
          "A reusable multi-select dropdown built from Nox MenuSurface, MenuItem and MenuScrollArea through the shared AnchoredMenu. Changes stay in a local draft while the menu is open. Closing via its trigger, Escape, outside click or focus departure calls choose once, only if the selection changed. Arrow keys/Home/End move through entries and Space/Enter toggle. The All row supports mixed state and preserves disabled selections. Press feedback scales only the icon and label using Nox's measured press target; the checkbox stays fixed. Trigger text stays fixed. Placement, glass, corners and entrance animation use the shared menu implementation.",
      },
    },
  },
} satisfies Meta<typeof Preview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const DisabledOption: Story = { args: { disabledLast: true } };

export const WithIcons: Story = { args: { withIcons: true } };
export const LongList: Story = { args: { many: true } };
export const Disabled: Story = { args: { disabled: true } };
