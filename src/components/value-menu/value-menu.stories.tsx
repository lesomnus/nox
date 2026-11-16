import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { useState } from "react";
import { Button, ValueMenu } from "@lesomnus/nox";

const meta = {
  title: "Components/ValueMenu",
  component: ValueMenu,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A value selector (combobox/listbox). By default a current-value or search row overlays the trigger, followed by the choices. Search opens empty and focused, with the current display value as its placeholder and all choices available until typing starts. alignItemWithTrigger instead positions the selected option itself over the trigger, with earlier/later options above/below it in source order. Search, hidden or missing selections retain the current-row layout. Shared feature comparisons live under Menus; its Docs page lists supported capabilities.",
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
export const LoadingDescriptions: Story = {
  render: function LoadingDescriptions() {
    const [loaded, setLoaded] = useState(false);
    const [value, setValue] = useState("");
    return (
      <div style={{ display: "grid", gap: "var(--ui-space)", width: 280 }}>
        <ValueMenu
          label="Account"
          value={value}
          choose={setValue}
          reserveDescriptionSpace
          alignItemWithTrigger
          options={[
            { value: "", label: "Choose an account" },
            ...(loaded
              ? [{ value: "work", label: "Work account", description: "work" }]
              : []),
          ]}
        />
        <Button
          onClick={async () => {
            if (loaded) {
              setLoaded(false);
              setValue("");
              return;
            }
            await new Promise((resolve) => setTimeout(resolve, 600));
            setLoaded(true);
          }}
        >
          {loaded ? "Reset options" : "Load options"}
        </Button>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Reserve description space before options load. Loading options and selecting a value with an alias keep the trigger's height stable; aligned menus use the same reserved frame.",
      },
    },
  },
};
export const IconGrid: Story = {
  args: {
    label: "Symbol",
    value: "circle",
    columns: 4,
    minMenuWidth: 280,
    searchable: true,
    valueIcon: null,
    options: [
      "Circle",
      "Square",
      "Triangle",
      "Diamond",
      "Star",
      "Hexagon",
      "Cross",
      "Ring",
    ].map((label, index) => ({
      value: label.toLowerCase(),
      label,
      disabled: label === "Triangle",
      icon: (
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          {
            [
              <circle cx="10" cy="10" r="6" fill="currentColor" />,
              <path d="M4 4h12v12H4z" fill="currentColor" />,
              <path d="M10 3 18 17H2Z" fill="currentColor" />,
              <path d="M10 2 18 10 10 18 2 10Z" fill="currentColor" />,
              <path
                d="m10 2 2.4 5 5.6.8-4 4 .9 5.6-4.9-2.6-4.9 2.6.9-5.6-4-4 5.6-.8Z"
                fill="currentColor"
              />,
              <path d="m6 3 8 0 4 7-4 7H6l-4-7Z" fill="currentColor" />,
              <path d="m4 4 12 12M4 16 16 4" />,
              <>
                <circle cx="10" cy="10" r="7" />
                <circle cx="10" cy="10" r="3" />
              </>,
            ][index]
          }
        </svg>
      ),
    })),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Multiple columns keep the same ValueMenu search, surface, selection and async feedback. Icons stack above centered labels. Arrow keys move spatially through enabled choices; Home/End reach the first/last option. valueIcon=null keeps the selected-value trigger text-only.",
      },
    },
  },
};
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
          "The trigger and current row use Section surfaces. Choices retain Section padding and corners with transparent resting backgrounds and standard selection and hover fills. Keyboard navigation, item alignment and scrolling retain ValueMenu behavior.",
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
