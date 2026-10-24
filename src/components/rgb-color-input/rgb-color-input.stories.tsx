import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { useId, useState } from "react";
import { Button, RgbColorInput, type RgbColor } from "@lesomnus/nox";
import styles from "./rgb-color-input.stories.module.css";

const initial: RgbColor = { r: 217, g: 255, b: 48 };
const css = (color: RgbColor) => `rgb(${color.r} ${color.g} ${color.b})`;
const meta = {
  title: "Components/RgbColorInput",
  component: RgbColorInput,
  tags: ["autodocs"],
  args: { label: "Color", value: initial },
  render: function Example(args) {
    const [, updateArgs] = useArgs();
    return (
      <div className={styles.example}>
        <RgbColorInput
          {...args}
          onChange={(value) => {
            args.onChange?.(value);
            updateArgs({ value });
          }}
        />
        <output aria-label="RGB value">{css(args.value ?? initial)}</output>
      </div>
    );
  },
} satisfies Meta<typeof RgbColorInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const ReadOnly: Story = { args: { readOnly: true } };
export const Localized: Story = {
  args: { label: "색상", channelLabels: { r: "빨강", g: "초록", b: "파랑" } },
};
export const Invalid: Story = {
  args: { "aria-invalid": true },
  render: function Example(args) {
    const description = useId();
    return (
      <div className={styles.example}>
        <RgbColorInput {...args} aria-describedby={description} readOnly />
        <p id={description} className={styles.hint}>
          Choose a color from the approved palette.
        </p>
      </div>
    );
  },
};
export const Uncontrolled: Story = {
  render: ({ value: _value, ...args }) => (
    <div className={styles.example}>
      <RgbColorInput {...args} defaultValue={initial} />
      <p className={styles.hint}>
        Paste #09f, rgb(12 34 56), or 12, 34, 56 into any channel.
      </p>
    </div>
  ),
};
export const Preview: Story = {
  render: function Example(args) {
    const [value, setValue] = useState(initial);
    return (
      <div className={styles.example}>
        <div className={styles.preview} style={{ backgroundColor: css(value) }}>
          <span>Live color preview</span>
        </div>
        <RgbColorInput {...args} value={value} onChange={setValue} />
        <div className={styles.buttons}>
          <Button
            effect="none"
            onClick={() => setValue({ r: 32, g: 128, b: 255 })}
          >
            Use blue
          </Button>
          <Button effect="none" onClick={() => setValue(initial)}>
            Reset color
          </Button>
        </div>
        <output aria-label="RGB value">{css(value)}</output>
      </div>
    );
  },
};
export const Form: Story = {
  render: function Example({ value: _value, ...args }) {
    const [submitted, setSubmitted] = useState("Not submitted");
    return (
      <form
        className={styles.example}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(
            JSON.stringify(
              Object.fromEntries(new FormData(event.currentTarget)),
            ),
          );
        }}
      >
        <RgbColorInput {...args} name="accent" defaultValue={initial} />
        <div className={styles.buttons}>
          <Button effect="none" type="submit">
            Submit
          </Button>
          <Button effect="none" type="reset">
            Reset
          </Button>
        </div>
        <output aria-label="Submitted channels">{submitted}</output>
      </form>
    );
  },
};
