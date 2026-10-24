import type { Meta, StoryObj } from "@storybook/react-vite";
import { StrictMode, useState } from "react";
import { AuroraGlow, Button, type AuroraGlowProps } from "@lesomnus/nox";
import styles from "./aurora-glow.stories.module.css";

const meta = {
  title: "Effects/AuroraGlow",
  component: AuroraGlow,
  tags: ["autodocs"],
  args: { active: true, paused: false, speed: 1 },
  argTypes: {
    palette: { control: "object" },
    strength: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
    speed: { control: { type: "range", min: 0, max: 4, step: 0.25 } },
    seed: { control: "number" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "The cxz composer aurora, extracted as a decorative CSS-gradient layer. Three drifting clusters contain orbiting colors, morphing orbs and wandering bright centers. Supply a positioned host with a definite size; the layer clips to its inherited radius and never intercepts input. active blooms/contracts the glow; paused and speed control movement independently. Colors and timing are theme tokens. Hidden/offscreen motion sleeps, reduced motion stays still, and no app state or WebGL is required. See docs/aurora-glow.md.",
      },
    },
  },
  render: (args) => (
    <div className={styles.stage}>
      <AuroraGlow {...args} />
    </div>
  ),
} satisfies Meta<typeof AuroraGlow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Standalone: Story = {};

function ToolbarExample(args: AuroraGlowProps) {
  return (
    <div className={styles.composer}>
      <div className={styles.toolbarFrame}>
        <AuroraGlow {...args} />
        <div className={styles.glass}>
          <Button effect="none" aria-label="Stop" className={styles.toolButton}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="7" y="7" width="10" height="10" rx="1" />
            </svg>
          </Button>
          <span className={styles.elapsed}>00:01:28</span>
          <Button effect="none" className={styles.send}>
            Send
          </Button>
        </div>
      </div>
      <div className={styles.editor}>Describe what to work on…</div>
    </div>
  );
}

export const Toolbar: Story = {
  render: (args) => <ToolbarExample {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          "A consumer-owned glass toolbar above the glow. The effect stays behind controls and within the rounded frame; the inset glass lets the moving colors reach its border. The editor and toolbar layout are composition examples, not dependencies of AuroraGlow.",
      },
    },
  },
};

export const CustomPalette: Story = {
  args: { palette: ["#b26a2c", "#bf4c69", "#7859c3"] },
};

export const Lifecycle: Story = {
  argTypes: { active: { control: false }, paused: { control: false } },
  render: function Lifecycle(args) {
    const [active, setActive] = useState(false);
    const [paused, setPaused] = useState(false);
    const [mounted, setMounted] = useState(true);
    return (
      <StrictMode>
        <div className={styles.lifecycle}>
          <div className={styles.controls}>
            <Button
              effect="none"
              aria-pressed={active}
              onClick={() => setActive(!active)}
            >
              Active
            </Button>
            <Button
              effect="none"
              aria-pressed={paused}
              onClick={() => setPaused(!paused)}
            >
              Paused
            </Button>
            <Button
              effect="none"
              aria-pressed={mounted}
              onClick={() => setMounted(!mounted)}
            >
              Mounted
            </Button>
          </div>
          <div className={styles.stage}>
            {mounted && (
              <AuroraGlow {...args} active={active} paused={paused} />
            )}
          </div>
        </div>
      </StrictMode>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Toggle Active to bloom or contract while continuing to drift. Paused freezes motion without hiding the glow. Mounted exercises cleanup and remounting under React StrictMode. Reactivation during contraction preserves the current movement instead of restarting the effect.",
      },
    },
  },
};
