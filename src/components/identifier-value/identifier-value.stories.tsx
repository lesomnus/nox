import type { Meta, StoryObj } from "@storybook/react-vite";
import { IdentifierValue } from "@lesomnus/nox";
const meta = {
  title: "Components/IdentifierValue",
  component: IdentifierValue,
  tags: ["autodocs"],
  args: { value: "1a2b3c4d-5e6f-7788-9900-aabbccddeeff" },
  parameters: {
    docs: {
      description: {
        component:
          "Stable-width identifier prefix, full-value in-place overlay on hover/focus, and copy of the original string.",
      },
    },
  },
} satisfies Meta<typeof IdentifierValue>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Short: Story = { args: { value: "oak" } };
export const Missing: Story = { args: { value: undefined } };
export const LongerPrefix: Story = { args: { prefixLength: 12 } };
export const WithoutCopy: Story = { args: { copyable: false } };
