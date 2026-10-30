import { SurfaceFailureExample } from "../../stories/handler-failures/surfaces";
import { StrictMode, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  Drawer,
  Card,
  ScrollArea,
  StippleBackground,
  type DrawerProps,
} from "@lesomnus/nox";
import styles from "./drawer.stories.module.css";

function Example({
  bounded = false,
  plain = false,
  long = false,
  ...args
}: DrawerProps & { bounded?: boolean; plain?: boolean; long?: boolean }) {
  const [open, setOpen] = useState(args.open);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [closed, setClosed] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const content = (
    <ScrollArea
      className={styles.scroll}
      contentClassName={styles.content}
      scrollbarLabel="Scroll task details"
    >
      <p>
        A card sits near the wall, leaving a narrow gap and the surrounding view
        visible.
      </p>
      <label className={styles.field}>
        Task name
        <input ref={input} defaultValue="Inspect build output" />
      </label>
      <p>
        The host owns task content and actions. Drawer owns placement, focus,
        dismissal and motion.
      </p>
      {long &&
        Array.from({ length: 25 }, (_, i) => (
          <p key={i}>
            Task {i + 1}: Inspect the recorded output and verify the result.
          </p>
        ))}
    </ScrollArea>
  );
  return (
    <>
      <div
        ref={setContainer}
        className={bounded ? styles.stage : styles.launcher}
        data-drawer-example="container"
      >
        {bounded && (
          <StippleBackground
            className={styles.stipple}
            maxFps={20}
            aria-hidden="true"
          />
        )}
        <Button onClick={() => setOpen(true)}>Open drawer</Button>
        {bounded && (
          <p>
            The overlay follows this container, even when it changes size or
            scrolls.
          </p>
        )}
      </div>
      <output className={styles.closed} aria-label="Completed closes">
        {closed}
      </output>
      <Drawer
        {...args}
        open={open}
        onClose={() => setOpen(false)}
        onClosed={() => setClosed((n) => n + 1)}
        container={bounded ? container : undefined}
        initialFocus={input}
        aria-label="Task details"
      >
        {plain ? (
          <section className={styles.plain}>
            <h2>Custom content</h2>
            <p>Drawer does not require Card or impose a card surface.</p>
            <Button onClick={() => setOpen(false)}>Close drawer</Button>
          </section>
        ) : (
          <Card
            fill
            bodyPadding="var(--ui-space)"
            title="Tasks · 3"
            close={() => setOpen(false)}
            closeLabel="Close drawer"
            footer={<Button onClick={() => setOpen(false)}>Done</Button>}
          >
            {content}
          </Card>
        )}
      </Drawer>
    </>
  );
}

const meta = {
  title: "Components/Drawer",
  component: Drawer,
  tags: ["autodocs"],
  args: {
    open: false,
    onClose: () => {},
    side: "right",
    align: "center",
    dismissible: true,
  },
  argTypes: {
    side: { control: "select", options: ["left", "right", "top", "bottom"] },
    align: { control: "select", options: ["start", "center", "end"] },
    width: { control: "text" },
    height: { control: "text" },
    inset: { control: "text" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A controlled modal drawer with independent direction, width, height, cross-axis alignment and inset. Container bounds only the visible overlay. Compose Card for the cxz task-detail card, or supply any other surface. Escape/backdrop request onClose; focus returns after exit. Provide aria-label or aria-labelledby.",
      },
    },
  },
  render: (args) => <Example {...args} />,
} satisfies Meta<typeof Drawer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Left: Story = { args: { side: "left", width: 340, height: 300 } };
export const Top: Story = { args: { side: "top", width: 520, height: 260 } };
export const Bottom: Story = {
  args: { side: "bottom", width: 520, height: 260 },
};
export const CustomSize: Story = {
  args: { width: 320, height: 280, align: "end", inset: 12 },
};
export const Contained: Story = {
  render: (args) => <Example {...args} bounded />,
};
export const LongContent: Story = {
  args: { width: 360, height: 360 },
  render: (args) => <Example {...args} long />,
};
export const WithoutCard: Story = {
  args: { width: 320, height: 240 },
  render: (args) => <Example {...args} plain />,
};
export const Protected: Story = {
  args: { dismissible: false, width: 340, height: 300 },
};
export const StrictLifecycle: Story = {
  render: (args) => (
    <StrictMode>
      <Example {...args} />
    </StrictMode>
  ),
};

export const FailureAndRetry = {
  render: () => <SurfaceFailureExample drawer />,
};
