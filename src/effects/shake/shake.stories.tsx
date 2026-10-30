import { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, SHAKE_PRESETS, useShake } from "@lesomnus/nox";
import guide from "../../../docs/shake.md?raw";
import styles from "./shake.stories.module.css";

type DemoProps = {
  targets: number;
  distance: number;
  duration: number;
  maxDelay: number;
  preset: string;
  scaled: boolean;
};
const meta = {
  title: "Effects/Shake",
  tags: ["autodocs"],
  parameters: { docs: { description: { component: guide } } },
  args: {
    targets: 6,
    distance: 3,
    duration: 420,
    maxDelay: 45,
    preset: "random",
    scaled: false,
  },
  argTypes: {
    targets: { control: { type: "range", min: 1, max: 12, step: 1 } },
    preset: {
      control: "select",
      options: ["random", ...SHAKE_PRESETS.map((p) => p.name)],
    },
    distance: { control: { type: "range", min: 0, max: 12, step: 1 } },
    duration: { control: { type: "range", min: 100, max: 1200, step: 50 } },
    maxDelay: { control: { type: "range", min: 0, max: 200, step: 5 } },
  },
  render: function Demo(args) {
    const targets = useRef<HTMLDivElement>(null);
    const { shake, cancel } = useShake();
    return (
      <section className={styles.example}>
        <div ref={targets} className={styles.targets}>
          {Array.from({ length: args.targets }, (_, i) => (
            <div
              key={i}
              data-shake-target={i}
              className={styles.target}
              style={{ transform: args.scaled ? "scale(0.9)" : undefined }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
          ))}
        </div>
        <div className={styles.actions}>
          <Button
            onClick={() =>
              shake(
                targets.current?.querySelectorAll("[data-shake-target]") ??
                  null,
                {
                  distance: args.distance,
                  duration: args.duration,
                  maxDelay: args.maxDelay,
                  presets:
                    args.preset === "random"
                      ? undefined
                      : SHAKE_PRESETS.filter((p) => p.name === args.preset),
                },
              )
            }
          >
            Shake targets
          </Button>
          <Button onClick={cancel}>Cancel motion</Button>
        </div>
      </section>
    );
  },
} satisfies Meta<DemoProps>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
