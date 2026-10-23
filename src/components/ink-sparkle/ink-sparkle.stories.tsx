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
  argTypes: {
    origin: { control: false },
    loop: { control: false },
    pressed: { control: false },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Press to spread ink from the contact point, hold to keep it expanded, then release to fade back to the original button color. Enter/Space use the center. Pointer cancellation and blur release the ink too. Expanded ink sleeps instead of continuously rendering; release preserves the current frame during the fade. Rapid presses overlap up to four overlays without changing Button's API.",
      },
    },
  },
  render: function ButtonClick(args) {
    const revision = useRef(0);
    const held = useRef<
      { id: number; pointer?: number; key?: string } | undefined
    >(undefined);
    const [bursts, setBursts] = useState<
      { id: number; origin: readonly [number, number]; pressed: boolean }[]
    >([]);
    const begin = (
      origin: readonly [number, number],
      source: { pointer?: number; key?: string },
    ) => {
      if (held.current) return;
      const id = ++revision.current;
      held.current = { id, ...source };
      setBursts((current) => [
        ...current.slice(-3),
        { id, origin, pressed: true },
      ]);
    };
    const release = () => {
      const id = held.current?.id;
      if (id === undefined) return;
      held.current = undefined;
      setBursts((current) =>
        current.map((burst) =>
          burst.id === id ? { ...burst, pressed: false } : burst,
        ),
      );
    };
    return (
      <div className={styles.clickExample}>
        <div className={styles.buttonSurface}>
          <Button
            variant="solid"
            className={styles.clickButton}
            onPointerDown={(event) => {
              if (event.button !== 0 || !event.isPrimary) return;
              const rect = event.currentTarget.getBoundingClientRect();
              begin([event.clientX - rect.left, event.clientY - rect.top], {
                pointer: event.pointerId,
              });
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerUp={(event) => {
              if (held.current?.pointer === event.pointerId) release();
            }}
            onPointerCancel={(event) => {
              if (held.current?.pointer === event.pointerId) release();
            }}
            onLostPointerCapture={(event) => {
              if (held.current?.pointer === event.pointerId) release();
            }}
            onKeyDown={(event) => {
              if (event.repeat || !["Enter", " "].includes(event.key)) return;
              const rect = event.currentTarget.getBoundingClientRect();
              begin([rect.width / 2, rect.height / 2], { key: event.key });
            }}
            onKeyUp={(event) => {
              if (held.current?.key === event.key) release();
            }}
            onBlur={release}
          >
            Press to sparkle
          </Button>
          {bursts.map(({ id, origin, pressed }) => (
            <InkSparkle
              {...args}
              key={id}
              origin={origin}
              loop={false}
              pressed={pressed}
              className={styles.buttonInk}
              onComplete={() =>
                setBursts((current) =>
                  current.filter((burst) => burst.id !== id),
                )
              }
            />
          ))}
        </div>
        <p>Press and hold, then release. Enter and Space work too.</p>
      </div>
    );
  },
};
export const ButtonTone: Story = {
  ...ButtonClick,
  args: { ...ButtonClick.args, color: [1, 1, 1, 0.06] },
  parameters: {
    docs: {
      description: {
        story:
          "The same press, hold and release interaction with a subtle neutral highlight. It stays close to the solid Button's native pressed background instead of adding a blue tint. Compare with ButtonClick; color and timing remain adjustable in Controls.",
      },
    },
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
