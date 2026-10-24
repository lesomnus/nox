import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionMenu, ValueMenu } from "@lesomnus/nox";

const meta = {
  title: "Components/ActionMenu",
  component: ActionMenu,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A menu beside its trigger, used for More actions and checked choices. Defaults to an ellipsis button; triggerContent can supply text or an icon. ActionMenu and ValueMenu share MenuSurface for portaling, theme appearance and trigger typography; their placement and interactions remain distinct.",
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
export const SharedSurface: Story = {
  render: function SharedSurfaceMenus(args) {
    const [effort, setEffort] = useState("medium");
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontFamily: "var(--ui-font-mono)",
        }}
      >
        <ActionMenu {...args} triggerContent="Actions" />
        <ValueMenu
          label="Effort"
          value={effort}
          choose={setEffort}
          options={["low", "medium", "high"].map((value) => ({
            value,
            label: value,
          }))}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Both menus use the same MenuSurface for foreground, translucent background, blur, frame and trigger typography. Open each menu in either theme: actions sit beside their trigger, while the selected value overlays its original text position.",
      },
    },
  },
};
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
export const Disabled: Story = {
  args: { disabled: true, disabledReason: "Unavailable while working" },
};

export const RevealFromTopLeft: Story = {
  args: { placement: "right", motion: { from: "top-left", effect: "reveal" } },
};
