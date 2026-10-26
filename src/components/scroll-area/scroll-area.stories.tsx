import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ScrollArea } from "@lesomnus/nox";
import docs from "../../../docs/scroll-area.md?raw";

const entries = (count: number) =>
  Array.from({ length: count }, (_, i) => (
    <div key={i} style={{ minHeight: 40, padding: "var(--ui-space)" }}>
      Entry {i + 1}
    </div>
  ));
const meta = {
  title: "Layout/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
  args: {
    scrollbarLabel: "Scroll entries",
    style: { height: 320 },
    children: entries(60),
  },
  argTypes: {
    scrollbarOffset: { control: "number" },
  },
  parameters: {
    docs: { description: { component: docs } },
  },
} satisfies Meta<typeof ScrollArea>;
export default meta;
export const LongList: StoryObj<typeof meta> = {};
export const ShortOverflow: StoryObj<typeof meta> = {
  args: { children: entries(9) },
};
export const NoOverflow: StoryObj<typeof meta> = {
  args: { children: entries(3) },
};
export const HorizontalOverflow: StoryObj<typeof meta> = {
  render: function Example(args) {
    const [wide, setWide] = useState(true);
    return (
      <section>
        <Button onClick={() => setWide((value) => !value)}>
          {wide ? "Fit content" : "Widen content"}
        </Button>
        <ScrollArea
          {...args}
          horizontalScrollbar
          horizontalScrollbarLabel="Scroll columns"
          style={{ height: 160 }}
        >
          <div
            style={{
              width: wide ? 1000 : "100%",
              padding: 12,
              boxSizing: "border-box",
            }}
          >
            Columns with native wheel and touch scrolling, plus a draggable
            horizontal handle.
            {args.scrollbarOffset !== undefined && args.children}
          </div>
        </ScrollArea>
      </section>
    );
  },
};
export const GrowingContent: StoryObj<typeof meta> = {
  render: function Growing(args) {
    const [count, setCount] = useState(9);
    const [top, setTop] = useState(0);
    const viewport = useRef<HTMLDivElement>(null);
    return (
      <section>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--ui-dialog-padding)",
            background: "var(--ui-shade-16)",
          }}
        >
          <strong>Entries</strong>
          <Button onClick={() => setCount((old) => old + 12)}>
            Add entries
          </Button>
        </header>
        <ScrollArea
          {...args}
          viewportRef={viewport}
          onScroll={(event) => {
            args.onScroll?.(event);
            setTop(Math.round(event.currentTarget.scrollTop));
          }}
          style={{ ...args.style, borderRadius: "var(--ui-dialog-radius)" }}
        >
          {entries(count)}
        </ScrollArea>
        <Button
          onClick={() => {
            if (viewport.current)
              viewport.current.scrollTop = viewport.current.scrollHeight;
          }}
        >
          Scroll to bottom
        </Button>
        <output aria-label="Scroll position">{top}</output>
      </section>
    );
  },
};

export const Outside: StoryObj<typeof meta> = {
  args: {
    scrollbarOffset: 12,
    style: { height: 320, borderRadius: "var(--ui-dialog-radius)" },
  },
  render: (args) => (
    <div style={{ padding: "var(--ui-scroll-area-hit-size)" }}>
      <ScrollArea {...args} />
    </div>
  ),
};
export const OutsideBothAxes: StoryObj<typeof meta> = {
  ...HorizontalOverflow,
  args: { scrollbarOffset: 12, children: entries(9) },
};
export const OutsideNoOverflow: StoryObj<typeof meta> = {
  ...Outside,
  args: { ...Outside.args, children: entries(3) },
};

export const BoundaryOffset: StoryObj<typeof meta> = {
  ...Outside,
  args: { ...Outside.args, scrollbarOffset: 0 },
};
export const InsetOffset: StoryObj<typeof meta> = {
  ...Outside,
  args: { ...Outside.args, scrollbarOffset: -16 },
};
