import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  DialogActions,
  DialogCard,
  DialogSurface,
} from "@lesomnus/nox";

const meta = {
  title: "Components/DialogCard",
  component: DialogCard,
  tags: ["autodocs"],
  args: {
    title: "Stop session",
    children: (
      <p>Active work stops. Conversation history and login are retained.</p>
    ),
    footer: (
      <DialogActions>
        <Button>Stop</Button>
        <Button>Cancel</Button>
      </DialogActions>
    ),
  },
  decorators: [
    (Story, context) => (
      <div
        style={{
          width: "min(30rem, 90vw)",
          ...(context.parameters.glassBackground && {
            padding: "var(--ui-dialog-padding)",
            borderRadius: "var(--ui-dialog-radius)",
            background:
              "repeating-linear-gradient(135deg, var(--ui-shade-16) 0 32px, var(--ui-shade-160) 32px 64px)",
          }),
        }}
      >
        <DialogSurface>
          <Story />
        </DialogSurface>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Shared dialog header, translucent body inset from the card edges using the control inset token, and compact footer. A continuous background layer supplies translucency and blur beneath all regions and their gaps. Header and footer add darker tints. Body text stays aligned with the heading; its radius accounts for the border and inset. DialogActions aligns actions together on the right. DialogSurface supplies transform-only motion without filling or filtering behind the card. Native modal wrappers supply focus and dismissal behavior. Forms and confirmations use the same structure and styling.",
      },
    },
  },
} satisfies Meta<typeof DialogCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Confirmation: Story = {};
export const GlassBody: Story = {
  parameters: { glassBackground: true },
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
      <DialogActions>
        <Button>Add</Button>
        <Button>Cancel</Button>
      </DialogActions>
    ),
  },
};
