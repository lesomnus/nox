import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../button/button";
import { CompactNumber } from "../compact-number/compact-number";
import {
  Dialog,
  DialogBody,
  DialogHeader,
  DialogTitle,
} from "../dialog/dialog";
import { Popover } from "./popover";

const meta = {
  title: "Components/Popover",
  component: Popover,
  tags: ["autodocs"],
  args: {
    content: "1a2b3c4d-5e6f-7788-9900-aabbccddeeff",
    children: "1a2b3c4",
  },
  argTypes: {
    placement: {
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
        "adjacent",
        "in-place",
      ],
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 120,
          overflow: "hidden",
          padding: 12,
          borderRadius: 12,
          background: "var(--ui-shade-24)",
          fontFamily: "var(--ui-font-mono)",
        }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Hover or focus the anchor to show text or React content in a fixed portal outside clipped containers. Placement controls the side and alignment, with viewport flipping and shifting. Use placement='in-place' to share the original text origin, baseline and typography. Existing DOM anchors can be controlled with anchor, open and onOpenChange. Escape, scrolling and resizing dismiss the popover.",
      },
    },
  },
} satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const BottomEnd: Story = { args: { placement: "bottom-end" } };
export const Right: Story = { args: { placement: "right" } };
export const Adjacent: Story = { args: { placement: "adjacent" } };
export const ViewportEdge: Story = {
  render: (args) => (
    <div style={{ position: "fixed", top: 8, right: 8 }}>
      <Popover {...args} />
    </div>
  ),
};

export const InPlace: Story = {
  args: { placement: "in-place" },
  render: (args) => (
    <Popover {...args}>
      <span
        style={{
          fontSize: 18,
          lineHeight: 2,
          fontWeight: 500,
          letterSpacing: "0.2px",
        }}
      >
        {args.children}
      </span>
    </Popover>
  ),
};

export const RichContent: Story = {
  args: {
    children: "report.md",
    content: (
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--ui-space)",
        }}
      >
        <CompactNumber value={12345} />
        <span>/workspace/report.md</span>
      </span>
    ),
  },
};

export const ControlledAnchor: Story = {
  render: function Controlled(args) {
    const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);
    return (
      <>
        <span id="existing-description" hidden>
          File information
        </span>
        <Button
          ref={setAnchor}
          aria-describedby="existing-description"
          onClick={() => setOpen(!open)}
        >
          File details
        </Button>
        <Popover
          anchor={anchor}
          open={open}
          onOpenChange={setOpen}
          content={args.content}
          placement={args.placement}
        />
      </>
    );
  },
};

export const InDialog: Story = {
  render: function InDialog(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Popover in dialog</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Popover {...args}>Nested value</Popover>
          </DialogBody>
        </Dialog>
      </>
    );
  },
};
