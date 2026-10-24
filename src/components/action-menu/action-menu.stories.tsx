import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionMenu } from "@lesomnus/nox";

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
