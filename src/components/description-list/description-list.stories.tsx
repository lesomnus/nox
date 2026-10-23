import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  DateTime,
  DescriptionList,
  EditableValue,
  IdentifierValue,
} from "@lesomnus/nox";
import { useState } from "react";

const meta = {
  title: "Components/DescriptionList",
  component: DescriptionList,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "min(480px, 85vw)" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    rows: [
      {
        label: "ID",
        value: <IdentifierValue value="1a2b3c4d-5e6f-7788-9900-aabbccddeeff" />,
      },
      { label: "Name", value: "Example workspace" },
      { label: "Created", value: <DateTime value="2026-10-20T02:38:19Z" /> },
      {
        label: "Status",
        value: "Ready",
        description: "The workspace is available for use.",
      },
      { label: "Count", value: 0 },
      { label: "Description", value: undefined },
    ],
  },
} satisfies Meta<typeof DescriptionList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const SingleColumn: Story = { args: { columns: 1 } };
export const Editable: Story = {
  render: function Example() {
    const [name, setName] = useState("My workspace");
    return (
      <DescriptionList
        rows={[
          {
            label: "Name",
            value: (
              <EditableValue
                label="Name"
                value={name}
                save={async (value) => setName(value)}
              />
            ),
          },
          { label: "State", value: "Ready" },
        ]}
      />
    );
  },
};
