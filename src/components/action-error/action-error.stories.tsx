import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ActionError, Button, UIProvider } from "@lesomnus/nox";
import guide from "../../../docs/handler-failures.md?raw";
import styles from "./action-error.stories.module.css";
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
    title: "Save failed",
    children: "Could not save the workspace. Your changes are preserved.",
  },
} satisfies Meta<typeof ActionError>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithRetry: Story = {
  args: { showRetry: true, onRetry: () => {} },
};
export const PendingRetry: Story = {
  args: { showRetry: true, onRetry: () => {}, pending: true },
};
export const TriggerStyling: Story = {
  render: (args) => {
    const [active, setActive] = useState<{
      anchor: HTMLButtonElement;
      highlight: boolean;
    }>();
    return (
      <div className={styles.examples}>
        <p>Dismiss the error to clear its trigger state.</p>
        <div className={styles.triggers}>
          {[
            {
              label: "Default border",
              className: "",
              highlight: true,
              variant: "default" as const,
            },
            {
              label: "Custom border",
              className: styles.customBorder,
              highlight: true,
              variant: "outline" as const,
            },
            {
              label: "Custom background",
              className: styles.customBackground,
              highlight: false,
              variant: "default" as const,
            },
          ].map((example) => (
            <Button
              key={example.label}
              className={example.className}
              variant={example.variant}
              onClick={(event) =>
                setActive({
                  anchor: event.currentTarget,
                  highlight: example.highlight,
                })
              }
            >
              {example.label}
            </Button>
          ))}
        </div>
        {active && (
          <ActionError
            {...args}
            anchor={active.anchor}
            highlightTrigger={active.highlight}
            onDismiss={() => setActive(undefined)}
          />
        )}
      </div>
    );
  },
};
export const Localized: Story = {
  render: () => (
    <UIProvider
      translate={(message) =>
        message === "Retry"
          ? "재시도"
          : message === "Action failed"
            ? "작업 실패"
            : message === "Dismiss error"
              ? "오류 닫기"
              : message === "Action failed. Please try again."
                ? "작업에 실패했습니다. 다시 시도해 주세요."
                : message
      }
    >
      <ActionError showRetry onRetry={() => {}} />
    </UIProvider>
  ),
};
