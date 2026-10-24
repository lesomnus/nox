import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { Progress, Switch } from "@lesomnus/nox";
import styles from "./progress.stories.module.css";

const meta = {
  title: "Components/Progress",
  component: Progress,
  tags: ["autodocs"],
  args: {
    "aria-label": "Download progress",
    value: 45,
    max: 100,
    animated: true,
    variant: "default",
  },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    animated: { control: "boolean" },
    variant: { control: "select", options: ["default", "bordered"] },
    sparkleOptions: { control: "object" },
  },
  decorators: [
    (Story) => (
      <div className={styles.frame}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "A boxed progress rail with a solid fill. animated controls width transitions and looping InkSparkle, whose fixed center sits outside the bar's left edge. The bordered variant uses the shared narrow control inset and concentric corners. State and timing belong to the host; provide an accessible name with aria-label or aria-labelledby.",
      },
    },
  },
} satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Static: Story = { args: { animated: false } };
export const Bordered: Story = {
  args: { variant: "bordered" },
  parameters: {
    docs: {
      description: {
        story:
          "The box has a one-pixel border and the shared two-pixel control inset between its inner edge and the rail. Outer and rail corner radii remain concentric. These styles belong to Progress itself.",
      },
    },
  },
};

export const CustomColors: Story = {
  args: { value: 65, variant: "bordered" },
  render: (args) => (
    <div className={styles.customColors}>
      <div className={styles.colorExample}>
        <span>Light bar · dark ink</span>
        <Progress
          {...args}
          className={styles.lightBar}
          aria-label="Light bar with dark ink"
          sparkleOptions={{
            ...args.sparkleOptions,
            color: [0, 0, 0, 0.4],
            sparkleColor: [0, 0, 0, 1],
          }}
        />
      </div>
      <div className={styles.colorExample}>
        <span>Dark bar · light ink</span>
        <Progress
          {...args}
          className={styles.darkBar}
          aria-label="Dark bar with light ink"
          sparkleOptions={{
            ...args.sparkleOptions,
            color: [1, 1, 1, 0.3],
            sparkleColor: [1, 1, 1, 0.8],
          }}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Set --ui-progress-fill-color for the bar and sparkleOptions.color / sparkleOptions.sparkleColor for its effect. Colors use normalized RGBA channels (0–1); alpha controls ink opacity and sparkle strength independently.",
      },
    },
  },
};

export const Interactive: Story = {
  render: function Interactive(args) {
    const [, updateArgs] = useArgs();
    return (
      <div className={styles.interactive}>
        <Progress {...args} />
        <label className={styles.valueControl}>
          <span>Value</span>
          <input
            type="range"
            aria-label="Progress value"
            min={0}
            max={args.max}
            value={args.value}
            onChange={(event) =>
              updateArgs({ value: Number(event.target.value) })
            }
          />
          <output>{Math.round((args.value / (args.max ?? 100)) * 100)}%</output>
        </label>
        <div className={styles.animationControl}>
          <span>Animation</span>
          <Switch
            label="Animate progress"
            checked={args.animated ?? true}
            onChange={(animated) => updateArgs({ animated })}
          />
        </div>
      </div>
    );
  },
};

export const States: Story = {
  args: { animated: false },
  render: (args) => (
    <div className={styles.states}>
      {[0, 50, 100].map((value) => (
        <div key={value} className={styles.state}>
          <span>{value}%</span>
          <Progress {...args} aria-label={`${value}% progress`} value={value} />
        </div>
      ))}
    </div>
  ),
};
