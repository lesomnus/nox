import { StrictMode, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  Switch,
  StippleBackground,
  clusterMotion,
  workMotion,
  withPointerBurst,
  type StippleMotion,
} from "@lesomnus/nox";
import styles from "./stipple-background.stories.module.css";

const orbitingPair: StippleMotion = (t) => [
  { x: 0.4 + 0.04 * Math.sin(t * 0.4), y: 0.5, radius: 0.22, color: 0 },
  { x: 0.6 - 0.04 * Math.sin(t * 0.4), y: 0.5, radius: 0.22, color: 1 },
];
const interactiveWorkMotion = withPointerBurst(workMotion);
const ellipticalOrbit: StippleMotion = (t, { seed }) => [
  {
    x: 0.5 + 0.18 * Math.cos(t * 0.3),
    y: 0.5 + 0.12 * Math.sin(t * 0.3),
    radius: 0.16,
    scale: [1.7, 0.6],
    rotation: t * 0.15 + 0.4,
    color: 0,
  },
  {
    x: 0.5 - 0.16 * Math.cos(t * 0.25),
    y: 0.5 - 0.18 * Math.sin(t * 0.25),
    radius: 0.13 + 0.04 * Math.sin(t * 0.2 + (seed % 10)),
    color: 1,
    wobble: 1,
  },
];

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
    colorBlend: "gradient",
    colorBlendWidth: 0.12,
    edgeFade: 0,
    edgeFadeSteps: 1,
    maxWidth: 1200,
    maxFps: 30,
    paused: false,
    active: true,
    backgroundColor: "#0a1438",
    palette: ["#b8e0f2", "#b3e6bd", "#c2baf0"],
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
    colorBlend: { control: "select", options: ["gradient", "dither", "none"] },
    colorBlendWidth: {
      control: { type: "range", min: 0, max: 0.5, step: 0.01 },
    },
    edgeFade: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
    edgeFadeSteps: { control: { type: "range", min: 0, max: 8, step: 1 } },
    motion: { control: false },
    pointerEffects: { control: false },
    backgroundColor: { control: "text" },
    onError: { action: "renderer error" },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A dot-only WebGL2 background. A metaball is an invisible rounded density field; a cluster pairs two metaballs with shared motion and color. Gradient blending interpolates dot colors at overlaps; dither blending interleaves dots while retaining exact palette colors. Supply motion(t, context) to control positions, radii, ellipses, rotation, deformation and growth. Built-in clusters drift, grow and fade inside the viewport. Each mount chooses a random seed unless one is provided. Children remain interactive above the canvas. Hidden/offscreen backgrounds pause and reduced motion renders a still. See docs/stipple-background.md for the callback contract and terminology.",
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
export const Seeded: Story = { args: { seed: 1, paused: true } };
export const ClusterMotion: Story = {
  args: { motion: clusterMotion },
  parameters: {
    docs: {
      description: {
        story:
          "The original motion is exported as clusterMotion. Passing this callback explicitly is equivalent to omitting motion; it can be shared between independent backgrounds.",
      },
    },
  },
};
export const ModifiedClusterMotion: Story = {
  args: {
    motion: (t, context) =>
      clusterMotion(t, context).map((ball) => ({
        ...ball,
        scale: [1.6, 0.7] as const,
        rotation: t * 0.1,
      })),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Compose the preset with your own shape changes. Copy each sample before changing it; the preset reuses its array and objects.",
      },
    },
  },
};
export const WorkMotion: Story = {
  args: { motion: interactiveWorkMotion, scatterPx: 120 },
  parameters: {
    docs: {
      description: {
        story:
          "Start work to slowly bloom different-sized metaballs at staggered times and bring others in from beyond the viewport. Independent breathing rhythms, weak local attraction and size-aware repulsion keep their drifting paths varied and spread out. While work continues, individual fields shrink away while moving, rest invisibly and bloom again at new positions. Finish work stops new births and keeps existing fields moving as they shrink. Start again during the exit to regrow without jumping. active is a lifecycle signal; paused freezes both movement and transitions.",
      },
    },
  },
  render: function Example(args) {
    const [working, setWorking] = useState(false);
    const [pointerEffects, setPointerEffects] = useState(true);
    return (
      <StippleBackground
        {...args}
        active={working}
        pointerEffects={pointerEffects}
      >
        <div className={styles.content}>
          <h2>Work in motion</h2>
          <p>Bloom, drift, interact, then quietly disappear.</p>
          <div className={styles.toolbar}>
            <Button onClick={() => setWorking(!working)}>
              {working ? "Finish work" : "Start work"}
            </Button>
            <label className={styles.effectToggle}>
              <span>Pointer bursts</span>
              <Switch
                label="Pointer bursts"
                checked={pointerEffects}
                onChange={setPointerEffects}
              />
            </label>
          </div>
        </div>
      </StippleBackground>
    );
  },
};
export const LiquidMetaball: Story = {
  args: { speed: 1, scatterPx: 4, palette: ["#fff"], backgroundColor: "#000" },
  parameters: {
    docs: {
      description: {
        story:
          "Liquid deformation forms moving lobes and a deep inward dent without cutting a hole through the field. Toggle to compare it with an undeformed circle. This is separate from ellipse scale/rotation and the smaller wobble ripples. Work Motion combines these controls for independently undulating droplets.",
      },
    },
  },
  render: function Example(args) {
    const [liquid, setLiquid] = useState(true);
    return (
      <StippleBackground
        {...args}
        motion={() => [
          { x: 0.5, y: 0.5, radius: 0.28, deformation: liquid ? 1 : 0 },
        ]}
      >
        <div className={styles.content}>
          <Button onClick={() => setLiquid(!liquid)}>
            {liquid ? "Use ellipse" : "Use liquid"}
          </Button>
        </div>
      </StippleBackground>
    );
  },
};
export const Palette: Story = {
  args: { palette: ["#f6bd60", "#f28482", "#84a59d", "#b8b8ff"] },
};
export const GradientBlend: Story = {
  args: {
    motion: orbitingPair,
    palette: ["#ff6b9d", "#70e1d0"],
    backgroundColor: "#0e1116",
    colorBlend: "gradient",
    colorBlendWidth: 0.16,
    speed: 1,
  },
};
export const DitherBlend: Story = {
  args: { ...GradientBlend.args, colorBlend: "dither" },
};
export const EdgeFade: Story = {
  args: {
    motion: () => [{ x: 0.5, y: 0.5, radius: 0.22 }],
    palette: ["#fff"],
    backgroundColor: "#000",
    edgeFade: 1,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Every dot is a uniform color. edgeFadeSteps caps additional shades per selected dot color: the default one adds a halfway-to-background shade; larger counts add evenly spaced shades and zero retains the original color. edgeFade controls strength without changing dot placement or density. Works with all blend modes and motions.",
      },
    },
  },
};
export const CustomMotion: Story = {
  args: { speed: 1 },
  render: function Example(args) {
    const [offset, setOffset] = useState(0);
    const [empty, setEmpty] = useState(false);
    return (
      <StippleBackground
        {...args}
        motion={(t, context) =>
          empty ? [] : ellipticalOrbit(t + offset, context)
        }
      >
        <div className={styles.content}>
          <h2>Your own motion</h2>
          <p>A rotating ellipse and an organic metaball, sampled from time.</p>
          <div className={styles.toolbar}>
            <Button onClick={() => setOffset(offset + 10)}>
              Change trajectory
            </Button>
            <Button onClick={() => setEmpty(!empty)}>
              {empty ? "Restore" : "Clear"}
            </Button>
          </div>
        </div>
      </StippleBackground>
    );
  },
};
export const MotionRecovery: Story = {
  render: function Example(args) {
    const [broken, setBroken] = useState(true);
    return (
      <StippleBackground
        {...args}
        motion={(t, context) => {
          if (broken)
            throw new Error("The custom motion could not be sampled.");
          return ellipticalOrbit(t, context);
        }}
      >
        <div className={styles.content}>
          <h2>Recover from a sampler error</h2>
          <p>The content stays interactive over the fallback background.</p>
          <Button onClick={() => setBroken(false)}>Use valid motion</Button>
        </div>
      </StippleBackground>
    );
  },
};
export const Wallpaper: Story = {
  args: { className: styles.wallpaper },
  parameters: { layout: "fullscreen" },
};
export const Monochrome: Story = {
  args: { backgroundColor: "#141414", palette: ["#bbb"] },
};
export const WithContent: Story = {
  render: function Example(args) {
    const [paused, setPaused] = useState(false);
    const [pattern, setPattern] = useState(args.pattern);
    const [palette, setPalette] = useState(args.palette);
    return (
      <StippleBackground
        {...args}
        pattern={pattern}
        paused={paused}
        palette={palette}
      >
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
            <Button
              onClick={() =>
                setPalette(["#f6bd60", "#f28482", "#84a59d", "#b8b8ff"])
              }
            >
              Change palette
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
