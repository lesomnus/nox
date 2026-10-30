import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { EditableValue } from "@lesomnus/nox";
import { EditableFailureExample } from "../../stories/handler-failures/editors";
const meta = {
  title: "Components/EditableValue",
  component: EditableValue,
  tags: ["autodocs"],
  args: { label: "Name", value: "My workspace", save: async () => {} },
  render: function Example(args) {
    const [value, setValue] = useState(args.value);
    return (
      <EditableValue
        {...args}
        value={value}
        save={async (next) => setValue(next)}
      />
    );
  },
} satisfies Meta<typeof EditableValue>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const FailureAndRetry: Story = {
  render: () => <EditableFailureExample />,
};
