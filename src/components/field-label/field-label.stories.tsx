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
  argTypes: {
    helpPlacement: {
      type: "string",
      control: "select",
      options: [
        "top-start",
        "top",
        "top-end",
        "bottom-start",
        "bottom",
        "bottom-end",
        "left-start",
        "left",
        "left-end",
        "right-start",
        "right",
        "right-end",
      ],
    },
  },
} satisfies Meta<typeof FieldLabel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const WithHelp: Story = {};
export const Plain: Story = { args: { label: "Name", description: undefined } };
export const BottomEnd: Story = { args: { helpPlacement: "bottom-end" } };
export const Right: Story = { args: { helpPlacement: "right" } };
export const ViewportEdges: Story = {
  render: (args) => (
    <>
      <div style={{ position: "fixed", top: 8, left: 8 }}>
        <FieldLabel {...args} label="Top edge" />
      </div>
      <div style={{ position: "fixed", right: 8, bottom: 8 }}>
        <FieldLabel {...args} label="Bottom edge" />
      </div>
    </>
  ),
};
