import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, NavigationPanel, PanelItem } from "@lesomnus/nox";
import { useState } from "react";

const meta = {
  title: "Layout/NavigationPanel",
  component: NavigationPanel,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 220, height: 440, display: "grid" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    title: "Documents",
    actions: (
      <Button variant="toolbar" aria-label="Add document">
        +
      </Button>
    ),
    scrollAreaProps: { scrollbarLabel: "Scroll documents" },
    children: Array.from({ length: 24 }, (_, i) => (
      <PanelItem key={i} aria-pressed={i === 0}>
        Document {i + 1}
      </PanelItem>
    )),
  },
  parameters: {
    docs: {
      description: {
        component:
          "Fixed header and rounded, inset scroll body. Header actions share DialogCard footer spacing; the body uses the tighter control inset and the same color/radius tokens. No router, resource model or provider required. Supply bounded height.",
      },
    },
  },
} satisfies Meta<typeof NavigationPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Settings: Story = {
  render: function Example() {
    const [value, setValue] = useState("General");
    return (
      <NavigationPanel title="Settings">
        {["General", "Editor"].map((label) => (
          <PanelItem
            key={label}
            aria-pressed={label === value}
            onClick={() => setValue(label)}
          >
            {label}
          </PanelItem>
        ))}
      </NavigationPanel>
    );
  },
};
export const Empty: Story = { args: { children: <p>No documents yet.</p> } };
