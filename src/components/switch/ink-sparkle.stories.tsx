import type { Meta, StoryObj } from "@storybook/react-vite";
import { InkSparkle } from "./ink-sparkle";

const meta = {
  title: "Effects/InkSparkle",
  component: InkSparkle,
  tags: ["autodocs"],
  args: {
    color: [0.4, 0.65, 1, 0.24],
    origin: [40, 90],
    seed: 1337,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Flutter's original InkSparkle fragment shader and 617ms animation, ported to WebGL2. This larger surface shows the unmodified triangle-noise sparkles, three rotating circle-grid turbulence layers, center migration, radius curve and independent opacity envelopes. The original white sparkles are retained even when the ink color is black. Nox repeats the one-shot effect while pending. Seed 1337 matches Flutter's constant test factory.",
      },
    },
  },
  render: (args) => (
    <div
      style={{
        width: 320,
        height: 180,
        background: "#202124",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <InkSparkle
        {...args}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  ),
} satisfies Meta<typeof InkSparkle>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Original: Story = {};
export const DarkInk: Story = {
  args: { color: [0, 0, 0, 0.5], origin: [280, 90] },
  render: (args) => (
    <div
      style={{
        width: 320,
        height: 180,
        background: "#cccccc",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <InkSparkle
        {...args}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  ),
};
