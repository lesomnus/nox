import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { useId, useState } from "react";
import { Button, ColorPicker, type RgbColor } from "@lesomnus/nox";
import styles from "./color-picker.stories.module.css";

const initial: RgbColor = { r: 217, g: 255, b: 48 };
const css = (color: RgbColor) =>
  `rgb(${color.r} ${color.g} ${color.b} / ${color.a ?? 1})`;
const meta = {
  title: "Components/ColorPicker",
  component: ColorPicker,
  tags: ["autodocs"],
  args: { label: "Color", value: initial },
  render: function Example(args) {
    const [, updateArgs] = useArgs();
    return (
      <div className={styles.example}>
        <ColorPicker
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
} satisfies Meta<typeof ColorPicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const ReadOnly: Story = { args: { readOnly: true } };
export const Translucent: Story = { args: { value: { ...initial, a: 0.4 } } };
export const Gray: Story = { args: { value: { r: 128, g: 128, b: 128 } } };
export const Black: Story = { args: { value: { r: 0, g: 0, b: 0 } } };
export const Localized: Story = {
  args: {
    label: "색상",
    labels: {
      area: "색상 영역",
      hue: "색조",
      alpha: "투명도",
      saturation: "채도",
      brightness: "밝기",
      instructions: "좌우 방향키로 채도, 위아래 방향키로 밝기를 조절합니다.",
    },
  },
};
export const Invalid: Story = {
  args: { "aria-invalid": true },
  render: function Example(args) {
    const description = useId();
    return (
      <div className={styles.example}>
        <ColorPicker {...args} aria-describedby={description} readOnly />
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
      <ColorPicker {...args} defaultValue={{ ...initial, a: 0.75 }} />
      <p className={styles.hint}>
        Click or drag inside the color field. Use Hue to choose a base color and
        Opacity to adjust transparency.
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
        <ColorPicker {...args} value={value} onChange={setValue} />
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
        <ColorPicker
          {...args}
          name="accent"
          defaultValue={{ ...initial, a: 0.75 }}
        />
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
