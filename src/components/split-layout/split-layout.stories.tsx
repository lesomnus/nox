import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SplitLayout, setSplitRatio, type SplitNode } from "@lesomnus/nox";

const nested: SplitNode = {
  kind: "split",
  id: "outer",
  axis: "horizontal",
  ratio: 0.5,
  first: { kind: "pane", id: "Left" },
  second: {
    kind: "split",
    id: "inner",
    axis: "vertical",
    ratio: 0.5,
    first: { kind: "pane", id: "Top right" },
    second: { kind: "pane", id: "Bottom right" },
  },
};

const meta = {
  title: "Layout/SplitLayout",
  component: SplitLayout,
  args: {
    node: nested,
    renderPane: (id: string) => id,
    onResize: () => {},
  },
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Controlled split panes with connected horizontal/vertical dividers. Drag a junction to resize both axes; aligned branches at a four-way crossing stay together. Junctions also accept all four arrow keys, Home/End and Enter/Space to equalize. Separators retain their own axis-specific keys and double-click reset. Use functional state updates in onResize because a junction updates multiple split IDs. Pane content and tab docking are supplied by the caller.",
      },
    },
  },
  render: function Example(args) {
    const [node, setNode] = useState<SplitNode>(args.node);
    useEffect(() => setNode(args.node), [args.node]);
    return (
      <div style={{ height: "70vh", padding: 8 }}>
        <SplitLayout
          {...args}
          node={node}
          onResize={(id, ratio) =>
            setNode((current) => setSplitRatio(current, id, ratio))
          }
          renderPane={(id) => (
            <div
              style={{
                padding: 16,
                boxSizing: "border-box",
                width: "100%",
                height: "100%",
                background: "var(--ui-shade-27)",
              }}
            >
              {id}
            </div>
          )}
        />
      </div>
    );
  },
} satisfies Meta<typeof SplitLayout>;
export default meta;
export const Nested: StoryObj<typeof meta> = {};
export const Transposed: StoryObj<typeof meta> = {
  args: {
    node: {
      kind: "split",
      id: "outer",
      axis: "vertical",
      ratio: 0.5,
      first: { kind: "pane", id: "Top" },
      second: {
        kind: "split",
        id: "inner",
        axis: "horizontal",
        ratio: 0.5,
        first: { kind: "pane", id: "Bottom left" },
        second: { kind: "pane", id: "Bottom right" },
      },
    },
  },
};
const crossing: SplitNode = {
  kind: "split",
  id: "outer",
  axis: "horizontal",
  ratio: 0.5,
  first: {
    kind: "split",
    id: "left",
    axis: "vertical",
    ratio: 0.5,
    first: { kind: "pane", id: "Top left" },
    second: { kind: "pane", id: "Bottom left" },
  },
  second: {
    kind: "split",
    id: "right",
    axis: "vertical",
    ratio: 0.5,
    first: { kind: "pane", id: "Top right" },
    second: { kind: "pane", id: "Bottom right" },
  },
};
export const Crossing: StoryObj<typeof meta> = { args: { node: crossing } };
export const OffsetJunctions: StoryObj<typeof meta> = {
  args: {
    node: setSplitRatio(setSplitRatio(crossing, "left", 0.35), "right", 0.65),
  },
};
