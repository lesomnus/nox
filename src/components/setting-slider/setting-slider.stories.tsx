import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { SettingSlider } from "@lesomnus/nox";

const meta = {
  title: "Components/SettingSlider",
  component: SettingSlider,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "The selected tick has a sliding background. Drag between ticks freely; the handle is gently attracted to ticks and settles at the nearest value on release. Keyboard input keeps the configured steps. Enable allowCustomValue for the numeric field beside the tick labels; customMax can bound accepted integers. The inherited position restores the parent setting.",
      },
    },
  },
  args: {
    label: "Indentation size",
    value: 4,
    inherited: 3,
    disabled: false,
    onChange: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
  render: function Interactive(args) {
    const [, updateArgs] = useArgs();
    return (
      <SettingSlider {...args} onChange={(value) => updateArgs({ value })} />
    );
  },
} satisfies Meta<typeof SettingSlider>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Inherited: Story = { args: { value: undefined } };
export const AboveRange: Story = { args: { value: 12 } };
export const CustomValue: Story = {
  args: { value: 12, allowCustomValue: true, customMax: 16 },
};
export const Disabled: Story = { args: { disabled: true } };
