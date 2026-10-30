import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Card, CardActions, ScrollArea } from "@lesomnus/nox";

const meta = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  args: {
    title: "Workspace information",
    fill: false,
    children: (
      <p>
        A portable heading, inset body and optional footer. Placement and
        interaction belong to the host.
      </p>
    ),
    footer: (
      <CardActions>
        <Button variant="solid">Save</Button>
        <Button variant="outline">Cancel</Button>
      </CardActions>
    ),
  },
  argTypes: { fill: { control: "boolean" }, bodyPadding: { control: "text" } },
  decorators: [
    (Story) => (
      <div style={{ width: "min(360px, calc(100vw - 48px))" }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Shared card surface for inline content, dialogs and drawers. The card owns appearance, heading, inset body and optional footer; it does not add a portal, modal behavior or animation. fill stretches into a bounded parent and supports a composed ScrollArea; bodyPadding accepts an independent CSS padding value. CardActions groups caller-owned buttons and preserves their variants.",
      },
    },
  },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Headerless: Story = {
  args: { hideHeading: true, bodyPadding: 0 },
};
export const Confirmation: Story = {
  args: {
    title: "Stop session",
    children: (
      <p>Active work stops. Conversation history and login are retained.</p>
    ),
  },
};
export const Form: Story = {
  args: {
    title: "Add account",
    close: () => {},
    closeLabel: "Close",
    children: (
      <label style={{ display: "grid", gap: "var(--ui-space)" }}>
        Alias
        <input placeholder="work" />
      </label>
    ),
    footer: (
      <CardActions>
        <Button>Add</Button>
        <Button>Cancel</Button>
      </CardActions>
    ),
  },
};
export const Filled: Story = {
  args: {
    title: "Task details",
    fill: true,
    bodyPadding: "var(--ui-space)",
    footer: <Button>Done</Button>,
    children: (
      <ScrollArea
        style={{ flex: 1, minHeight: 0 }}
        scrollbarLabel="Scroll card content"
      >
        {Array.from({ length: 30 }, (_, i) => (
          <p key={i} style={{ padding: "0 8px" }}>
            Task {i + 1}: Inspect the output and verify the result.
          </p>
        ))}
      </ScrollArea>
    ),
  },
  render: (args) => (
    <div style={{ height: 280 }}>
      <Card {...args} />
    </div>
  ),
};
export const CustomPadding: Story = { args: { bodyPadding: 8 } };
export const WithoutFooter: Story = { args: { footer: undefined } };
