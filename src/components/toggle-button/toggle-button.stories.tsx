import { SelectionFailureExample } from "../../stories/handler-failures/selections";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToggleButton, Button } from "@lesomnus/nox";
import { useRef, useState } from "react";

const meta = {
  title: "Components/ToggleButton",
  component: ToggleButton,
  tags: ["autodocs"],
  args: { children: "Bold" },
} satisfies Meta<typeof ToggleButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Pressed: Story = { args: { defaultPressed: true } };
export const Disabled: Story = {
  args: { disabled: true, defaultPressed: true },
};
export const Toolbar: Story = {
  args: {
    variant: "toolbar",
    "aria-label": "Show details",
    children: ({ pressed }) => (
      <svg
        width="16"
        height="16"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M4 10h12" />
        {!pressed && <path d="M10 4v12" />}
      </svg>
    ),
  },
};
export const Controlled: Story = {
  render: function Controlled(args) {
    const [pressed, setPressed] = useState(false);
    return (
      <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
        <ToggleButton
          {...args}
          pressed={pressed}
          onPressedChange={setPressed}
        />
        <output>{pressed ? "On" : "Off"}</output>
        <Button onClick={() => setPressed(false)}>Reset</Button>
      </div>
    );
  },
};
export const Interaction: Story = {
  render: function Interaction() {
    const ref = useRef<HTMLButtonElement>(null);
    const [changes, setChanges] = useState(0);
    const [submits, setSubmits] = useState(0);
    return (
      <form
        style={{ display: "grid", gap: 12, justifyItems: "start" }}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmits((n) => n + 1);
        }}
      >
        <ToggleButton
          ref={ref}
          onPressedChange={() => setChanges((n) => n + 1)}
        >
          Uncontrolled
        </ToggleButton>
        <ToggleButton pressed onPressedChange={() => setChanges((n) => n + 1)}>
          Controlled without update
        </ToggleButton>
        <ToggleButton disabled>Disabled</ToggleButton>
        <ToggleButton aria-disabled="true">Aria disabled</ToggleButton>
        <ToggleButton loading>Loading</ToggleButton>
        <ToggleButton onClick={(event) => event.preventDefault()}>
          Prevented
        </ToggleButton>
        <Button type="button" onClick={() => ref.current?.focus()}>
          Focus toggle
        </Button>
        <output>
          Changes: {changes}; submits: {submits}
        </output>
      </form>
    );
  },
};

export const FailureAndRetry = {
  render: () => <SelectionFailureExample kind="toggle" />,
};
