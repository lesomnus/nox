import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonAnchor, PanelItemAnchor } from "@lesomnus/nox";
import { useRef, useState } from "react";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "New session",
    disabled: false,
    loading: false,
    type: "button",
    effect: "sparkle",
  },
  argTypes: {
    effect: { control: "select", options: ["sparkle", "none"] },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoEffect: Story = { args: { effect: "none", variant: "solid" } };
export const CustomInk: Story = {
  args: {
    variant: "solid",
    effectOptions: {
      color: [0.4, 0.65, 1, 0.15],
      sparkleColor: [0.4, 0.65, 1, 0.25],
      duration: 1200,
    },
  },
};
export const PreventedPress: Story = {
  args: {
    children: "Handled externally",
    onPointerDown: (event) => event.preventDefault(),
    onKeyDown: (event) => event.preventDefault(),
  },
};
export const EffectInteraction: Story = {
  render: function EffectInteraction(args) {
    const ref = useRef<HTMLButtonElement>(null);
    const [clicks, setClicks] = useState(0);
    const [submits, setSubmits] = useState(0);
    const [downs, setDowns] = useState(0);
    const [keys, setKeys] = useState(0);
    const [disabled, setDisabled] = useState(false);
    return (
      <form
        style={{ display: "grid", gap: 12, justifyItems: "start" }}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmits((n) => n + 1);
        }}
      >
        <Button
          {...args}
          ref={ref}
          type="submit"
          variant="solid"
          disabled={disabled}
          onClick={() => setClicks((n) => n + 1)}
          onPointerDown={() => setDowns((n) => n + 1)}
          onKeyDown={() => setKeys((n) => n + 1)}
        >
          Save with ink
        </Button>
        <output>
          Clicks: {clicks}; submits: {submits}; pointer downs: {downs}; keys:{" "}
          {keys}
        </output>
        <Button
          type="button"
          effect="none"
          onClick={() => ref.current?.focus()}
        >
          Focus save
        </Button>
        <Button
          type="button"
          effect="none"
          onClick={() => setDisabled(!disabled)}
        >
          {disabled ? "Enable save" : "Disable save"}
        </Button>
      </form>
    );
  },
};
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

export const LinkInteraction: Story = {
  render: function LinkInteraction() {
    const ref = useRef<HTMLAnchorElement>(null);
    const [clicks, setClicks] = useState(0);
    const [downs, setDowns] = useState(0);
    const [keys, setKeys] = useState(0);
    return (
      <nav aria-label="Example links" style={{ display: "grid", gap: 12 }}>
        <ButtonAnchor
          ref={ref}
          href="#destination"
          onClick={() => setClicks((n) => n + 1)}
          onPointerDown={() => setDowns((n) => n + 1)}
          onKeyDown={() => setKeys((n) => n + 1)}
        >
          Open project
        </ButtonAnchor>
        <output>
          Clicks: {clicks}; pointer downs: {downs}; keys: {keys}
        </output>
        <Button effect="none" onClick={() => ref.current?.focus()}>
          Focus link
        </Button>
        <ButtonAnchor href="#disabled" aria-disabled="true">
          Disabled link
        </ButtonAnchor>
        <ButtonAnchor href="#quiet" effect="none">
          Link without ink
        </ButtonAnchor>
        <ButtonAnchor
          href="#prevented"
          onPointerDown={(e) => e.preventDefault()}
          onKeyDown={(e) => e.preventDefault()}
        >
          Prevented press
        </ButtonAnchor>
        <PanelItemAnchor href="#panel-destination">Panel link</PanelItemAnchor>
      </nav>
    );
  },
};
