import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@lesomnus/nox";
import { useState } from "react";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "New session",
    disabled: false,
    loading: false,
    type: "button",
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Solid: Story = {
  args: { variant: "solid", children: "Save changes" },
};
export const Outline: Story = {
  args: { variant: "outline", children: "Cancel" },
};
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 16 }}>
      {(["default", "solid", "outline"] as const).map((variant) => (
        <div
          key={variant}
          style={{
            display: "grid",
            gridTemplateColumns: "72px repeat(3, max-content)",
            gap: 16,
            alignItems: "center",
          }}
        >
          <span style={{ color: "var(--ui-muted)" }}>{variant}</span>
          <Button {...args} variant={variant}>
            Save changes
          </Button>
          <Button {...args} variant={variant} loading>
            Save changes
          </Button>
          <Button {...args} variant={variant} disabled loading={false}>
            Save changes
          </Button>
        </div>
      ))}
    </div>
  ),
};
export const LongLabel: Story = {
  args: { children: "Save project settings" },
};

export const Loading: Story = { args: { loading: true } };
export const LoadingLongLabel: Story = {
  args: { loading: true, children: "Save project settings" },
};
export const LoadingWithIcon: Story = {
  args: {
    loading: true,
    children: (
      <>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="m5 12 4 4L19 6" />
        </svg>
        <span>Save changes</span>
      </>
    ),
  },
};

export const LoadingInteraction: Story = {
  render: function Interaction(args) {
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState(0);
    const [submits, setSubmits] = useState(0);
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmits((n) => n + 1);
        }}
        style={{ display: "grid", justifyItems: "center", gap: 12 }}
      >
        <Button
          {...args}
          type="submit"
          loading={loading}
          onClick={() => {
            setRequests((n) => n + 1);
            setLoading(true);
          }}
        >
          Save project settings
        </Button>
        <output>
          Requests: {requests}; submits: {submits}
        </output>
        <Button
          type="button"
          disabled={!loading}
          onClick={() => setLoading(false)}
        >
          Finish loading
        </Button>
      </form>
    );
  },
};

export const ToolbarIcon: Story = {
  args: {
    variant: "toolbar",
    "aria-label": "Send",
    children: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M12 19V5m-6 6 6-6 6 6" />
      </svg>
    ),
  },
};

export const LoadingToolbarIcon: Story = {
  args: { ...ToolbarIcon.args, loading: true },
};
