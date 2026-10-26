import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionMenu, Button } from "@lesomnus/nox";

const meta = {
  title: "Components/ActionMenu",
  component: ActionMenu,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A menu beside its trigger, used for commands and checked choices. This page keeps the basic API and an action-driven trigger example. Shared feature comparisons live under Menus/Features; placement, motion, shortcut labels and dangerous actions are demonstrated in the top-level Menus gallery.",
      },
    },
  },
  args: {
    label: "More",
    items: [
      { label: "Details", run: () => {} },
      { label: "Restart", run: () => {} },
      { label: "Stop", danger: true, run: () => {} },
    ],
  },
} satisfies Meta<typeof ActionMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const More: Story = {};
export const Language: Story = {
  args: { label: "Voice language" },
  render: function LanguageMenu(args) {
    const [language, setLanguage] = useState("English (US)");
    return (
      <ActionMenu
        {...args}
        triggerContent={language}
        items={["English (US)", "한국어", "日本語"].map((label) => ({
          label,
          checked: label === language,
          run: () => setLanguage(label),
        }))}
      />
    );
  },
  decorators: [
    (Story) => (
      <div style={{ width: 180 }}>
        <Story />
      </div>
    ),
  ],
};

export const OutsideScrollbar: Story = {
  args: {
    label: "Scrollable actions",
    placement: "above",
    scrollbarOffset: 12,
    motion: { from: "bottom-right", effect: "reveal" },
    footer: <Button>Keep menu open</Button>,
    items: Array.from({ length: 30 }, (_, i) => ({
      label: `Action ${i + 1}`,
      run: () => {},
    })),
  },
  decorators: [
    (Story) => (
      <div style={{ position: "fixed", bottom: 8, right: 4 }}>
        <Story />
      </div>
    ),
  ],
};
