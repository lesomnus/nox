import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionError, UIProvider } from "@lesomnus/nox";
import guide from "../../../docs/handler-failures.md?raw";
const meta = {
  title: "Components/ActionError",
  component: ActionError,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: guide } } },
  decorators: [
    (Story) => (
      <div style={{ width: "min(480px, 85vw)" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    children: "Could not save the workspace. Your changes are preserved.",
  },
} satisfies Meta<typeof ActionError>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithRetry: Story = { args: { onRetry: () => {} } };
export const PendingRetry: Story = {
  args: { onRetry: () => {}, pending: true },
};
export const Localized: Story = {
  render: () => (
    <UIProvider
      translate={(message) =>
        message === "Retry"
          ? "재시도"
          : message === "Action failed. Please try again."
            ? "작업에 실패했습니다. 다시 시도해 주세요."
            : message
      }
    >
      <ActionError onRetry={() => {}} />
    </UIProvider>
  ),
};
