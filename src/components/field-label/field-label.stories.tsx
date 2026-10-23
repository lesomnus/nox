import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldLabel } from "@lesomnus/nox";
const meta = {
  title: "Components/FieldLabel",
  component: FieldLabel,
  tags: ["autodocs"],
  args: {
    label: "Provisioning",
    description: "Status and current step of preparing the workspace.",
  },
} satisfies Meta<typeof FieldLabel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const WithHelp: Story = {};
export const Plain: Story = { args: { label: "Name", description: undefined } };
