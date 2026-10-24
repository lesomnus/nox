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
    onChange: () => {},
  },
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Controlled split panes with connected horizontal/vertical dividers. Pass onChange to store the complete tree, including topology changes when a continuous boundary is detached at an aligned four-way crossing. Aligned opposing segments hover and move as one line. Drag an offset segment near its opposite to snap; release to join them. Double-click then drag, or drag on the second press, to detach one side without snapping back. Drag a junction to resize both axes. Arrow keys and Home/End resize connected lines; Enter/Space or double-click on a junction equalizes its splits. Double-clicking a standalone separator still equalizes it; releasing a double-click drag keeps its position. The legacy onResize callback supports ratio changes without topology changes. Pane content and tab docking belong to the caller.",
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
          onChange={setNode}
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
export const Crossing: StoryObj<typeof meta> = {
  args: { node: crossing },
  parameters: {
    docs: {
      description: {
        story:
          "Hover or drag either horizontal half: both halves act as one line. Double-click any half, horizontal or vertical, to detach it; dragging on the second press also works. Detaching a continuous vertical boundary rearranges the split tree while keeping the panes in place. The center junction continues to resize both axes.",
      },
    },
  },
};
export const TransposedCrossing: StoryObj<typeof meta> = {
  args: {
    node: {
      kind: "split",
      id: "outer",
      axis: "vertical",
      ratio: 0.5,
      first: {
        kind: "split",
        id: "top",
        axis: "horizontal",
        ratio: 0.5,
        first: { kind: "pane", id: "Top left" },
        second: { kind: "pane", id: "Top right" },
      },
      second: {
        kind: "split",
        id: "bottom",
        axis: "horizontal",
        ratio: 0.5,
        first: { kind: "pane", id: "Bottom left" },
        second: { kind: "pane", id: "Bottom right" },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "The same crossing with the tree axes reversed. Detach either horizontal half or vertical half; the gesture and release behavior is independent of the tree orientation.",
      },
    },
  },
};
export const OffsetJunctions: StoryObj<typeof meta> = {
  args: {
    node: setSplitRatio(setSplitRatio(crossing, "left", 0.35), "right", 0.65),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Drag either horizontal segment toward the opposite segment. It snaps into alignment near the other line and stays there through small pointer movements. Pull farther to release the snap, or release the pointer to join the two segments for subsequent drags. Double-click and drag one side to separate it again.",
      },
    },
  },
};
