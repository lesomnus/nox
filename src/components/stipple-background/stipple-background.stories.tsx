import { StrictMode, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, StippleBackground } from "@lesomnus/nox";
import styles from "./stipple-background.stories.module.css";

const meta = {
  title: "Effects/StippleBackground",
  component: StippleBackground,
  tags: ["autodocs"],
  args: {
    pattern: "diamond",
    speed: 0.2,
    grainPx: 1,
    scatterPx: 800,
    merge: 0.01,
    maxWidth: 1200,
    maxFps: 30,
    seed: 1,
    paused: false,
    backgroundColor: "#0a1438",
    colors: ["#b8e0f2", "#b3e6bd", "#c2baf0"],
    className: styles.preview,
  },
  argTypes: {
    pattern: {
      control: "select",
      options: ["bayer8", "checker", "diamond", "hex", "fractal"],
    },
    speed: { control: { type: "range", min: 0, max: 2, step: 0.05 } },
    grainPx: { control: { type: "range", min: 0.25, max: 4, step: 0.25 } },
    scatterPx: { control: { type: "range", min: 0, max: 1200, step: 20 } },
    merge: { control: { type: "range", min: 0, max: 0.1, step: 0.005 } },
    backgroundColor: { control: "text" },
    onError: { action: "renderer error" },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "WebGL2 metaballs with stippled edges, adapted from the supplied wallpaper. Five patterns, a three-color hex palette and configurable motion. Give the container a size; children remain interactive above the decorative canvas. Hidden/offscreen backgrounds pause automatically and reduced motion renders a still. WebGL unavailability falls back to the background color.",
      },
    },
  },
} satisfies Meta<typeof StippleBackground>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Diamond: Story = {};
export const Bayer: Story = { args: { pattern: "bayer8" } };
export const Checker: Story = { args: { pattern: "checker" } };
export const Hex: Story = { args: { pattern: "hex" } };
export const Fractal: Story = { args: { pattern: "fractal" } };
export const Still: Story = { args: { paused: true } };
export const Wallpaper: Story = {
  args: { className: styles.wallpaper },
  parameters: { layout: "fullscreen" },
};
export const Monochrome: Story = {
  args: { backgroundColor: "#141414", colors: ["#aaa", "#ddd", "#888"] },
};
export const WithContent: Story = {
  render: function Example(args) {
    const [paused, setPaused] = useState(false);
    const [pattern, setPattern] = useState(args.pattern);
    return (
      <StippleBackground {...args} pattern={pattern} paused={paused}>
        <div className={styles.content}>
          <h2>A little atmosphere</h2>
          <p>Stippled light, slowly drifting.</p>
          <div className={styles.toolbar}>
            <Button onClick={() => setPaused(!paused)}>
              {paused ? "Resume" : "Pause"}
            </Button>
            <Button
              onClick={() =>
                setPattern(pattern === "diamond" ? "hex" : "diamond")
              }
            >
              Change pattern
            </Button>
          </div>
        </div>
      </StippleBackground>
    );
  },
};
export const StrictLifecycle: Story = {
  render: function Example(args) {
    const [mounted, setMounted] = useState(true);
    return (
      <>
        <Button onClick={() => setMounted(!mounted)}>
          {mounted ? "Unmount" : "Mount"}
        </Button>
        <StrictMode>{mounted && <StippleBackground {...args} />}</StrictMode>
      </>
    );
  },
};
