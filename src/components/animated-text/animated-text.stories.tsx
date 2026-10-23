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
  render: function Rollover() {
    const [seconds, setSeconds] = useState(59);
    return (
      <div className={styles.clocks}>
        <ElapsedTime
          durationMs={seconds * 1000}
          label="Rollover elapsed time"
          motion="slide"
          duration={600}
        />
        <DateTime
          value={Date.UTC(2026, 9, 23, 23, 59, seconds)}
          motion="flip"
          duration={600}
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
