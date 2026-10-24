import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { ValueMenu } from "@lesomnus/nox";

const meta = {
  title: "Components/ValueMenu",
  component: ValueMenu,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A value selector (combobox/listbox). The selected row overlays the trigger text in place, followed by a divider and other choices. This page keeps the basic API and value-specific edge cases. Shared feature comparisons live under Menus/Features; the top-level Menus Docs page lists supported capabilities.",
      },
    },
  },
  args: {
    choose: () => {},
    label: "Effort",
    value: "medium",
    disabled: false,
    options: [
      { value: "default", label: "medium", muted: true },
      { value: "low", label: "low" },
      { value: "medium", label: "medium" },
      { value: "high", label: "high" },
    ],
  },
  render: function Interactive(args) {
    const [, updateArgs] = useArgs();
    return <ValueMenu {...args} choose={(value) => updateArgs({ value })} />;
  },
} satisfies Meta<typeof ValueMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Separators: Story = {
  args: {
    value: "low",
    options: [
      { value: "default", label: "Project default", muted: true },
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High", separatorBefore: true },
      { value: "maximum", label: "Maximum" },
    ],
  },
};

export const NoMatches: Story = {
  args: {
    searchable: true,
    options: [{ value: "medium", label: "Medium" }],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Open the selector to see No matches. Only the current value is configured, so there are no remaining search results. The empty row uses muted, smaller text and the same padding and row height as other menu items, without browser paragraph margins.",
      },
    },
  },
};

export const CompactNoMatches: Story = {
  ...NoMatches,
  args: { ...NoMatches.args, variant: "compact" },
  decorators: [
    (Story) => (
      <div style={{ fontSize: 11 }}>
        <Story />
      </div>
    ),
  ],
};

export const EmptySections: Story = {
  args: {
    groups: [
      { label: "Current", items: [{ value: "medium", label: "Medium" }] },
      { label: "Empty", items: [] },
      {
        label: "Remaining",
        items: [{ value: "high", label: "High", separatorBefore: true }],
      },
    ],
  },
};
