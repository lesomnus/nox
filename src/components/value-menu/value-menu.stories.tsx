import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { useState } from "react";
import { ValueMenu } from "@lesomnus/nox";

const meta = {
  title: "Components/ValueMenu",
  component: ValueMenu,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A value selector (combobox/listbox). By default a current-value or search row overlays the trigger, followed by the choices. alignItemWithTrigger instead positions the selected option itself over the trigger, with earlier/later options above/below it in source order. Search, hidden or missing selections retain the current-row layout. Shared feature comparisons live under Menus; its Docs page lists supported capabilities.",
      },
    },
  },
  args: {
    choose: () => {},
    label: "Effort",
    value: "medium",
    disabled: false,
    hideSelected: false,
    alignItemWithTrigger: false,
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
export const ItemAligned: Story = {
  args: {
    alignItemWithTrigger: true,
    options: [
      { value: "low", label: "Low" },
      { value: "balanced", label: "Balanced" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High", disabled: true },
      { value: "maximum", label: "Maximum" },
    ],
  },
};
export const Descriptions: Story = {
  args: {
    label: "Workspace",
    value: "atlas",
    alignItemWithTrigger: true,
    options: [
      { value: "", label: "Choose a workspace" },
      {
        value: "atlas",
        label: "Atlas workspace",
        description: "atlas",
        icon: (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor">
            <circle cx="8" cy="8" r="5" />
          </svg>
        ),
      },
      {
        value: "sandbox",
        label: "Sandbox preview",
        description: "sandbox",
        icon: (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor">
            <path d="M3 3h10v10H3z" />
          </svg>
        ),
      },
    ],
  },
};
export const SearchableDescriptions: Story = {
  ...Descriptions,
  args: { ...Descriptions.args, searchable: true },
};

export const SectionCards: Story = {
  ...Descriptions,
  args: {
    ...Descriptions.args,
    variant: "section",
    options: Descriptions.args!.options!.map((option, index) => ({
      ...option,
      trailing: (
        <span
          style={{ color: "var(--ui-muted)", font: "11px var(--ui-font-mono)" }}
        >
          {index ? "Updated today" : "Choose a workspace"}
        </span>
      ),
    })),
  },
  parameters: {
    docs: {
      description: {
        story:
          "The trigger, current row and each selectable option are Section buttons, using the same padding, background and corners as standalone sections. Keyboard navigation, item alignment and scrolling retain ValueMenu behavior.",
      },
    },
  },
};
export const HideSelected: Story = { args: { hideSelected: true } };
export const Searchable: Story = { args: { searchable: true } };
export const SearchableHideSelected: Story = {
  args: { searchable: true, hideSelected: true },
};

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
    hideSelected: true,
    options: [{ value: "medium", label: "Medium" }],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Only the current value is configured and hideSelected is enabled, so there are no remaining search results. The empty row uses muted, smaller text and the same padding and row height as other menu items, without browser paragraph margins.",
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

export const SelectionEvents: Story = {
  render: function SelectionEvents(args) {
    const [value, setValue] = useState(args.value);
    const [changes, setChanges] = useState(0);
    return (
      <div style={{ display: "grid", gap: 12, minWidth: 180 }}>
        <ValueMenu
          {...args}
          value={value}
          choose={(next) => {
            setValue(next);
            setChanges((n) => n + 1);
          }}
        />
        <output>Changes: {changes}</output>
      </div>
    );
  },
};
