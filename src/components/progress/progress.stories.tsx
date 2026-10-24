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
