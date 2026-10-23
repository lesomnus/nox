import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { InkSparkle } from "@lesomnus/nox";

const meta = {
  title: "Effects/InkSparkle",
  component: InkSparkle,
  tags: ["autodocs"],
  args: {
    color: [0.4, 0.65, 1, 0.24],
    origin: [40, 90],
    seed: 1337,
    loop: true,
    duration: 617,
    centerMotion: "to-center",
  },
  argTypes: {
    duration: { control: { type: "range", min: 100, max: 4000, step: 100 } },
    centerMotion: { control: "select", options: ["to-center", "fixed"] },
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
export const Slow: Story = { args: { duration: 2000 } };
export const OutsideCenter: Story = {
  args: { duration: 2000, centerMotion: "fixed", origin: [-24, 90] },
};
export const SpeedComparison: Story = {
  render: function SpeedComparison(args) {
    const [revision, setRevision] = useState(0);
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <button onClick={() => setRevision((value) => value + 1)}>
          Restart both
        </button>
        {[617, 2000].map((duration) => (
          <div key={duration}>
            <div>{duration}ms</div>
            <div
              style={{
                width: 320,
                height: 180,
                background: "#202124",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <InkSparkle {...args} key={revision} duration={duration} />
            </div>
          </div>
        ))}
      </div>
    );
  },
};
export const SingleBurst: Story = {
  args: { loop: false, duration: 2000 },
  render: function SingleBurst(args) {
    const [revision, setRevision] = useState(0);
    const [completed, setCompleted] = useState(0);
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <button
          onClick={() => {
            setCompleted(0);
            setRevision((value) => value + 1);
          }}
        >
          Replay
        </button>
        <output aria-label="Completed bursts">{completed}</output>
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
            key={revision}
            onComplete={() => setCompleted((value) => value + 1)}
          />
        </div>
      </div>
    );
  },
};
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
