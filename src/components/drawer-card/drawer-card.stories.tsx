import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, DrawerCard, ScrollArea } from "@lesomnus/nox";

const meta = {
  title: "Components/DrawerCard",
  component: DrawerCard,
  tags: ["autodocs"],
  args: {
    title: "Task details",
    close: () => {},
    closeLabel: "Close details",
    children: (
      <ScrollArea
        scrollbarLabel="Scroll details"
        style={{ flex: 1, minHeight: 0 }}
      >
        <p style={{ padding: "8px" }}>
          A reusable card surface with a compact heading, an inset body and an
          optional footer.
        </p>
      </ScrollArea>
    ),
    footer: <Button>Done</Button>,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "min(360px, calc(100vw - 48px))", height: 280 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "The rounded, translucent card from cxz task details. This surface fills its parent's size and reuses DialogCard's header, inset body and footer. Compose ScrollArea for overflowing content. It has no portal, focus handling, placement or animation; Drawer supplies those independently.",
      },
    },
  },
} satisfies Meta<typeof DrawerCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithoutFooter: Story = { args: { footer: undefined } };
