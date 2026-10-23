import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { AnimatedText, Button, DateTime, ElapsedTime } from "@lesomnus/nox";
import styles from "./animated-text.stories.module.css";

const meta = {
  title: "Components/AnimatedText",
  component: AnimatedText,
  tags: ["autodocs"],
  args: { value: 59, motion: "slide", direction: "auto", duration: 600 },
  argTypes: {
    motion: { control: "select", options: ["none", "slide", "flip"] },
    direction: { control: "select", options: ["auto", "up", "down"] },
    maxFlipSteps: { control: { type: "number", min: 1, max: 26, step: 1 } },
  },
  render: function Interactive(args) {
    const [, updateArgs] = useArgs();
    return (
      <div className={styles.preview}>
        <AnimatedText {...args} className={styles.value} />
        <div className={styles.actions}>
          <Button onClick={() => updateArgs({ value: Number(args.value) + 1 })}>
            Increase
          </Button>
          <Button onClick={() => updateArgs({ value: Number(args.value) - 1 })}>
            Decrease
          </Button>
          <Button onClick={() => updateArgs({ value: 59 })}>Reset</Button>
        </div>
      </div>
    );
  },
} satisfies Meta<typeof AnimatedText>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Slide: Story = {};
export const SlideUp: Story = { args: { direction: "up" } };
export const SlideDown: Story = { args: { direction: "down" } };
export const Flip: Story = { args: { motion: "flip" } };
export const NoMotion: Story = { args: { motion: "none" } };

const textExample: Story["render"] = function TextExample(args) {
  const [, updateArgs] = useArgs();
  return (
    <div className={styles.preview}>
      <AnimatedText {...args} className={styles.value} />
      <div className={styles.actions}>
        {["READY", "BOARD", "CLOSED"].map((value) => (
          <Button key={value} onClick={() => updateArgs({ value })}>
            {value}
          </Button>
        ))}
      </div>
    </div>
  );
};
export const TextSlide: Story = {
  args: { value: "READY" },
  render: textExample,
};
export const TextFlip: Story = {
  args: { value: "READY", motion: "flip" },
  render: textExample,
};
export const FlipForwardOnly: Story = {
  args: { value: "READY", motion: "flip", direction: "down" },
  render: textExample,
};
export const FlipThrough: Story = {
  args: {
    value: "A",
    motion: "flip",
    direction: "down",
    duration: 900,
    maxFlipSteps: 6,
  },
  render: function FlipThrough(args) {
    const [, updateArgs] = useArgs();
    return (
      <div className={styles.preview}>
        <AnimatedText {...args} className={styles.value} />
        <small>
          Distance-based flips · max {args.maxFlipSteps ?? 1} per character ·{" "}
          {args.duration} ms total
        </small>
        <div className={styles.actions}>
          {["A", "D", "Z"].map((value) => (
            <Button key={value} onClick={() => updateArgs({ value })}>
              {value}
            </Button>
          ))}
        </div>
      </div>
    );
  },
};
export const DepartureBoard: Story = {
  args: {
    value: "SEOUL",
    motion: "flip",
    direction: "down",
    duration: 900,
    maxFlipSteps: 6,
  },
  render: function DepartureBoard(args) {
    const [, updateArgs] = useArgs();
    return (
      <div className={styles.preview}>
        <AnimatedText {...args} className={styles.value} />
        <div className={styles.actions}>
          {["SEOUL", "TOKYO", "PARIS", "OSAKA"].map((value) => (
            <Button key={value} onClick={() => updateArgs({ value })}>
              {value}
            </Button>
          ))}
        </div>
      </div>
    );
  },
};
export const KoreanText: Story = {
  args: {
    value: "가나다",
    motion: "flip",
    direction: "down",
    duration: 900,
    maxFlipSteps: 5,
    flipCharacters: "가나다라마바사아자차카타파하",
  },
  render: function KoreanText(args) {
    const [, updateArgs] = useArgs();
    return (
      <div className={styles.preview}>
        <AnimatedText {...args} className={styles.value} />
        <div className={styles.actions}>
          {["가나다", "라마바", "사아자"].map((value) => (
            <Button key={value} onClick={() => updateArgs({ value })}>
              {value}
            </Button>
          ))}
        </div>
      </div>
    );
  },
};
export const Clocks: Story = {
  render: function Clocks() {
    const [startedAt] = useState(() => Date.now() - 58_000);
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
      const timer = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(timer);
    }, []);
    return (
      <div className={styles.clocks}>
        <div>
          <small>Live date · slide down</small>
          <DateTime value={now} motion="slide" direction="down" />
        </div>
        <div>
          <small>Live date · split flap</small>
          <DateTime value={now} motion="flip" />
        </div>
        <div>
          <small>Elapsed · slide up</small>
          <ElapsedTime
            startedAt={startedAt}
            label="Sliding elapsed time"
            motion="slide"
            direction="up"
          />
        </div>
        <div>
          <small>Elapsed · split flap</small>
          <ElapsedTime
            startedAt={startedAt}
            label="Flipping elapsed time"
            motion="flip"
          />
        </div>
      </div>
    );
  },
};
export const Rollover: Story = {
  render: function Rollover(args) {
    const [seconds, setSeconds] = useState(59);
    return (
      <div className={styles.clocks}>
        <ElapsedTime
          durationMs={seconds * 1000}
          label="Rollover elapsed time"
          motion={args.motion}
          direction={args.direction}
          duration={args.duration}
          maxFlipSteps={args.maxFlipSteps}
          flipCharacters={args.flipCharacters}
        />
        <DateTime
          value={Date.UTC(2026, 9, 23, 23, 59, seconds)}
          motion="flip"
          direction={args.direction}
          duration={args.duration}
          maxFlipSteps={args.maxFlipSteps}
          flipCharacters={args.flipCharacters}
        />
        <div className={styles.actions}>
          <Button onClick={() => setSeconds((value) => value + 1)}>
            Next second
          </Button>
          <Button onClick={() => setSeconds((value) => value - 1)}>
            Previous second
          </Button>
        </div>
      </div>
    );
  },
};
