import { SelectionFailureExample } from "../../stories/handler-failures/selections";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { SegmentedControl } from "@lesomnus/nox";

const meta = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
  args: {
    onChange: () => {},
    label: "Theme",
    value: "dark",
    disabled: false,
    options: [
      { value: "system", label: "System", muted: true },
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
    ],
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
      <SegmentedControl {...args} onChange={(value) => updateArgs({ value })} />
    );
  },
} satisfies Meta<typeof SegmentedControl>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Compact: Story = { args: { size: "compact" } };

export const CompactIcons: Story = {
  args: {
    label: "Tab input",
    size: "compact",
    iconOnly: true,
    value: "spaces",
    options: [
      {
        value: "tab",
        label: "Tab character",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >
            <path d="M3 10h11m-4-4 4 4-4 4m7-10v12" />
          </svg>
        ),
      },
      {
        value: "spaces",
        label: "Spaces",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="5" cy="10" r="1" />
            <circle cx="10" cy="10" r="1" />
            <circle cx="15" cy="10" r="1" />
          </svg>
        ),
      },
    ],
  },
};

export const TabInput: Story = {
  args: {
    label: "Tab input",
    value: "spaces",
    options: [
      { value: "default", label: "Spaces", muted: true },
      { value: "spaces", label: "Spaces" },
      { value: "tab", label: "Tab" },
    ],
  },
};

export const FailureAndRetry = {
  render: () => <SelectionFailureExample kind="segments" />,
};
