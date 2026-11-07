import type { Meta, StoryObj } from "@storybook/react-vite";
import { PathValue } from "@lesomnus/nox";
import docs from "../../../docs/path-value.md?raw";
const meta = {
  title: "Components/PathValue",
  component: PathValue,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: docs } } },
  args: {
    value:
      "/home/alex/workspaces/repository/packages/client/src/configuration.json",
    label: "Copy file path",
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 260,
          minWidth: 120,
          resize: "horizontal",
          overflow: "auto",
          font: "12px/1.5 var(--ui-font-mono)",
          padding: 8,
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PathValue>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Windows: Story = {
  args: { value: "C:\\Users\\alex\\workspace\\client\\configuration.json" },
};
export const Unicode: Story = {
  args: { value: "/home/alex/projects/한글-경로/👩‍💻-configuration.json" },
};
