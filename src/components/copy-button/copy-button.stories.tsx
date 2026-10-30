import type { Meta, StoryObj } from "@storybook/react-vite";
import { CopyButton } from "@lesomnus/nox";
const meta = {
  title: "Components/CopyButton",
  component: CopyButton,
  tags: ["autodocs"],
  args: { value: "Copied from Nox" },
} satisfies Meta<typeof CopyButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
