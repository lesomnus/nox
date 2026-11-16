import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { useState } from "react";
import {
  Button,
  Slider,
  SliderRoot,
  SliderControl,
  SliderValue,
  SliderTicks,
} from "@lesomnus/nox";
const meta = {
  title: "Components/Slider",
  component: Slider,
  tags: ["autodocs"],
  args: { label: "Volume", min: 0, max: 100, step: 1, value: 40 },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
  render: function Example(args) {
    const [, updateArgs] = useArgs();
    return <Slider {...args} onChange={(value) => updateArgs({ value })} />;
  },
} satisfies Meta<typeof Slider>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const ReadOnly: Story = { args: { readOnly: true } };
export const Vertical: Story = { args: { orientation: "vertical" } };
export const Composed: Story = {
  render: function Example(args) {
    const [value, setValue] = useState(40);
    return (
      <SliderRoot
        {...args}
        value={value}
        onChange={setValue}
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 36px",
          gap: 8,
        }}
      >
        <SliderControl />
        <SliderValue aria-label="Volume value" />
        <SliderTicks values={[0, 25, 50, 75, 100]} style={{ gridColumn: 1 }} />
      </SliderRoot>
    );
  },
};
export const Form: Story = {
  render: function Example() {
    const [submitted, setSubmitted] = useState("");
    return (
      <form
        style={{ display: "grid", gap: 12 }}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(String(new FormData(event.currentTarget).get("gain")));
        }}
      >
        <SliderRoot
          label="Gain"
          name="gain"
          min={-10}
          max={10}
          step={0.5}
          defaultValue={2.5}
          style={{ display: "grid", gap: 8 }}
        >
          <SliderValue aria-label="Gain value" />
          <SliderControl />
          <SliderTicks values={[-10, 0, 10]} />
        </SliderRoot>
        <div>
          <Button effect="none" type="submit">
            Submit
          </Button>
          <Button effect="none" type="reset">
            Reset
          </Button>
        </div>
        <output aria-label="Submitted gain">{submitted}</output>
      </form>
    );
  },
};
export const MagneticSteps: Story = {
  args: { min: 0, max: 8, step: 1, value: 4 },
  render: function Example(args) {
    const [value, setValue] = useState(args.value ?? 4);
    return (
      <SliderRoot
        {...args}
        value={value}
        onChange={setValue}
        style={{ display: "grid", gap: 0 }}
      >
        <SliderControl />
        <SliderTicks
          highlight
          selectable
          marks
          values={[0, 1, 2, 3, 4, 5, 6, 7, 8]}
        />
      </SliderRoot>
    );
  },
};
