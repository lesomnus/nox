import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { Button, InkSparkle } from "@lesomnus/nox";
import styles from "./ink-sparkle.stories.module.css";

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
export const ButtonClick: Story = {
  args: { loop: false, duration: 1200 },
  argTypes: { origin: { control: false }, loop: { control: false } },
  parameters: {
    docs: {
      description: {
        story:
          "Compose the public Button and InkSparkle components without changing Button. A click starts a single burst at its local position; keyboard activation starts at the center. The overlay follows the button's bounds, leaves the label's press animation intact and never intercepts input. Rapid clicks overlap up to four bursts; completed canvases are removed.",
      },
    },
  },
  render: function ButtonClick(args) {
    const revision = useRef(0);
    const [bursts, setBursts] = useState<
      { id: number; origin: readonly [number, number] }[]
    >([]);
    return (
      <div className={styles.clickExample}>
        <div className={styles.buttonSurface}>
          <Button
            variant="solid"
            className={styles.clickButton}
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const origin: readonly [number, number] =
                event.detail === 0
                  ? [rect.width / 2, rect.height / 2]
                  : [event.clientX - rect.left, event.clientY - rect.top];
              const id = ++revision.current;
              setBursts((current) => [...current.slice(-3), { id, origin }]);
            }}
          >
            Click to sparkle
          </Button>
          {bursts.map(({ id, origin }) => (
            <InkSparkle
              {...args}
              key={id}
              origin={origin}
              loop={false}
              className={styles.buttonInk}
              onComplete={() =>
                setBursts((current) =>
                  current.filter((burst) => burst.id !== id),
                )
              }
            />
          ))}
        </div>
        <p>
          Click anywhere on the button, or focus it and press Enter or Space.
        </p>
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
