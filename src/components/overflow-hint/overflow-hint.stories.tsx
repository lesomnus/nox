import type { Meta, StoryObj } from "@storybook/react-vite";
import { OverflowHint } from "./overflow-hint";

const meta = {
  title: "Components/OverflowHint",
  component: OverflowHint,
  tags: ["autodocs"],
  args: {
    content: "1a2b3c4d-5e6f-7788-9900-aabbccddeeff",
    children: "1a2b3c4",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 120,
          overflow: "hidden",
          padding: 12,
          borderRadius: 12,
          background: "var(--ui-shade-24)",
          fontFamily: "var(--ui-font-mono)",
        }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Hover or focus the abbreviated text. The full value is a fixed portal outside this clipped container, constrained to the viewport. Escape, scrolling and resizing dismiss the hint.",
      },
    },
  },
} satisfies Meta<typeof OverflowHint>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
