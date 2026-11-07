import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useState } from "react";
import { Tabs, CompactNumber, SlidingPages, SlidingPage } from "@lesomnus/nox";
import docs from "../../../docs/tabs.md?raw";
const meta = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: docs } } },
  args: {
    "aria-label": "Example tabs",
    value: "one",
    onValueChange: () => {},
    items: [
      { id: "one", label: "First" },
      { id: "two", label: "Second" },
      { id: "three", label: "Unavailable", disabled: true },
    ],
  },
  render: function Example(args) {
    const [value, setValue] = useState(args.value);
    return <Tabs {...args} value={value} onValueChange={setValue} />;
  },
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Steps: Story = {
  render: function Example() {
    const [value, setValue] = useState("0");
    const id = useId();
    return (
      <div style={{ width: 400 }}>
        <Tabs
          prefix={id}
          panelId={`${id}-panel`}
          aria-label="Setup steps"
          value={value}
          onValueChange={setValue}
          items={[0, 1, 2].map((index) => ({
            id: String(index),
            label: (
              <CompactNumber mode="integer" digits={2} value={index + 1} />
            ),
            icon: <span>{index < Number(value) ? "✓" : "○"}</span>,
          }))}
        />
        <SlidingPages value={value}>
          {[0, 1, 2].map((index) => (
            <SlidingPage
              key={index}
              value={String(index)}
              role="tabpanel"
              id={value === String(index) ? `${id}-panel` : undefined}
              aria-labelledby={`${id}-${index}`}
            >
              <p>
                {
                  [
                    "Choose a destination.",
                    "Review your preferences.",
                    "Everything is ready.",
                  ][index]
                }
              </p>
            </SlidingPage>
          ))}
        </SlidingPages>
      </div>
    );
  },
};
