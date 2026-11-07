import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AnimatedCompactNumber,
  AnimatedDurationDisplay,
  Button,
  ScrollArea,
} from "@lesomnus/nox";

const meta = {
  title: "Components/AnimatedCompactNumber",
  component: AnimatedCompactNumber,
  tags: ["autodocs"],
  args: { value: 6_547_000, label: "Value" },
  parameters: {
    docs: {
      description: {
        component:
          "The complete numeric reveal preset: gray dash placeholders, bounded continuous digit slides, color arrival, top-left spatial starts, random character delays and offscreen cancellation without scroll-entry replay. Defaults to 600ms and four steps. Set animate=false for cached values. Motion options remain configurable; spatialDelay and characterJitter control the default stagger.",
      },
    },
  },
} satisfies Meta<typeof AnimatedCompactNumber>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Integer: Story = {
  args: { value: 9, mode: "integer", digits: 3 },
};
export const Cached: Story = { args: { animate: false } };
export const Configured: Story = {
  args: {
    duration: 1200,
    maxSlideSteps: 3,
    spatialDelay: false,
    characterJitter: 0,
  },
};
export const LoadingAndRefresh: Story = {
  render: function LoadingAndRefresh(args) {
    const [state, setState] = useState({ value: NaN, cached: false });
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <AnimatedCompactNumber
          {...args}
          value={state.value}
          animate={!state.cached && args.animate !== false}
        />
        <Button onClick={() => setState({ value: 9_999_999, cached: false })}>
          Load value
        </Button>
        <Button onClick={() => setState({ value: 6_547_000, cached: false })}>
          Refresh value
        </Button>
        <Button onClick={() => setState({ value: 12_345, cached: true })}>
          Use cached value
        </Button>
        <Button onClick={() => setState({ value: NaN, cached: false })}>
          Reset
        </Button>
      </div>
    );
  },
};
export const ScrollableGrid: Story = {
  render: function ScrollableGrid(args) {
    const [revision, setRevision] = useState(0);
    return (
      <div style={{ width: 720, maxWidth: "calc(100vw - 32px)", padding: 16 }}>
        <Button onClick={() => setRevision((value) => value + 1)}>
          Load grid
        </Button>
        <ScrollArea
          style={{ height: 200, marginTop: 16 }}
          scrollbarLabel="Scroll values"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 32,
              padding: 16,
            }}
          >
            {Array.from({ length: 18 }, (_, index) => (
              <div key={index} style={{ display: "grid", gap: 8 }}>
                <small>Metric {index + 1}</small>
                <AnimatedCompactNumber
                  {...args}
                  value={
                    revision
                      ? 6_547_000 + index * 12_345 + (revision - 1) * 1_000_000
                      : NaN
                  }
                  label={`Metric ${index + 1}`}
                />
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1" }}>
              <AnimatedDurationDisplay
                durationMs={revision ? 2 * 86_400_000 + 5 * 60_000 : undefined}
                label="Remaining time"
              />
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  },
};
