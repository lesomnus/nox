import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button, InkSparkle } from "@lesomnus/nox";
import styles from "./ink-sparkle.stories.module.css";

const meta = {
  title: "Effects/InkSparkle",
  component: InkSparkle,
  tags: ["autodocs"],
  args: {
    color: [0.4, 0.65, 1, 0.24],
    sparkleColor: [1, 1, 1, 1],
    origin: [40, 90],
    seed: 1337,
    loop: true,
    duration: 617,
    centerMotion: "to-center",
  },
  argTypes: {
    duration: { control: { type: "range", min: 100, max: 4000, step: 100 } },
    centerMotion: { control: "select", options: ["to-center", "fixed"] },
    sparkleColor: { control: "object" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Flutter's InkSparkle shader and animation ported to WebGL2. The original triangle noise, turbulence, geometry and opacity envelopes are retained. color controls the ink; sparkleColor independently sets normalized RGBA for the sparkling pixels, with alpha controlling strength. Omit sparkleColor for Flutter's original white sparkles. Seed 1337 matches Flutter's constant test factory.",
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
export const SoftSparkles: Story = {
  args: { sparkleColor: [0.65, 0.65, 0.65, 0.2] },
};
export const TintedSparkles: Story = {
  args: { sparkleColor: [0.25, 0.5, 0.75, 0.6] },
};
export const SparkleColors: Story = {
  args: { color: [0, 0, 0, 0.2], duration: 2000, seed: 1337 },
  render: (args) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
        gap: 16,
      }}
    >
      {(
        [
          ["Original white", undefined],
          ["Subtle white", [1, 1, 1, 0.2]],
          ["Tinted", [0.25, 0.5, 0.75, 1]],
          ["No sparkles", [1, 1, 1, 0]],
        ] as const
      ).map(([label, sparkleColor]) => (
        <div key={label}>
          <div>{label}</div>
          <div
            style={{
              width: "100%",
              height: 180,
              background: "#202124",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <InkSparkle {...args} sparkleColor={sparkleColor} />
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Identical ink, seed and timing with default, softened, tinted and disabled sparkles. Changing sparkle alpha preserves the underlying ink instead of fading the whole effect.",
      },
    },
  },
};
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
export const ButtonClick: Story = {
  args: { loop: false, duration: 1200 },
  argTypes: {
    origin: { control: false },
    loop: { control: false },
    pressed: { control: false },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Press to spread ink from the contact point, hold to keep it expanded, then release to fade back to the original button color. Enter/Space use the center. Pointer cancellation and blur release the ink too. Expanded ink sleeps instead of continuously rendering; release resumes the remaining expansion and fade, even after a quick tap. The shared Button handles the lifecycle through its default sparkle effect; effectOptions customizes the ink.",
      },
    },
  },
  render: function ButtonClick(args) {
    return (
      <div className={styles.clickExample}>
        <Button
          variant="solid"
          className={styles.clickButton}
          effectOptions={{
            color: args.color,
            sparkleColor: args.sparkleColor,
            duration: args.duration,
            centerMotion: args.centerMotion,
            seed: args.seed,
          }}
        >
          Press to sparkle
        </Button>
        <p>Press and hold, then release. Enter and Space work too.</p>
      </div>
    );
  },
};

export const ButtonTone: Story = {
  ...ButtonClick,
  args: {
    ...ButtonClick.args,
    color: [1, 1, 1, 0.06],
    sparkleColor: [1, 1, 1, 0.2],
  },
  parameters: {
    docs: {
      description: {
        story:
          "The same press, hold and release interaction with a subtle neutral highlight and lower-strength white sparkles. Compare with ButtonClick; ink color, sparkle color/strength and timing remain adjustable in Controls.",
      },
    },
  },
};
export const DarkInk: Story = {
  args: {
    color: [0, 0, 0, 0.5],
    origin: [280, 90],
    duration: 1200,
  },
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
