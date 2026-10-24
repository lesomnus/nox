import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button, Skeleton, SkeletonGroup } from "@lesomnus/nox";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  args: { width: 180 },
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Rectangle: Story = { args: { variant: "rect", height: 90 } };
export const Circle: Story = { args: { variant: "circle", width: 40 } };
export const Static: Story = { args: { animated: false } };
export const Profile: Story = {
  render: () => (
    <SkeletonGroup
      role="status"
      aria-label="Loading profile"
      style={{ display: "flex", alignItems: "center", gap: 12, width: 280 }}
    >
      <Skeleton variant="circle" width={40} style={{ flex: "none" }} />
      <div style={{ display: "grid", gap: 8, flex: 1 }}>
        <Skeleton width="65%" />
        <Skeleton />
      </div>
    </SkeletonGroup>
  ),
};

export const Grouped: Story = {
  render: ({ animated, sparkleOptions }) => (
    <section style={{ width: 400, maxWidth: "100%" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 8,
          fontSize: 12,
        }}
      >
        <span>A</span>
        <span>B</span>
      </div>
      <SkeletonGroup
        animated={animated}
        sparkleOptions={{ duration: 2400, seed: 7, ...sparkleOptions }}
        role="status"
        aria-label="Loading panels"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
      >
        <Skeleton variant="rect" height={80} data-panel="a" />
        <Skeleton variant="rect" height={80} data-panel="b" />
      </SkeletonGroup>
    </section>
  ),
};
export const GroupedStatic: Story = {
  render: Grouped.render,
  args: { animated: false },
};

export const GroupedOrigin: Story = {
  render: function Example({ animated, sparkleOptions }) {
    const [x, setX] = useState(-40);
    const [y, setY] = useState(-40);
    return (
      <section style={{ width: 400, maxWidth: "100%" }}>
        <div
          style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 12 }}
        >
          <label>
            Origin X{" "}
            <input
              aria-label="Origin X"
              type="number"
              value={x}
              onChange={(event) => setX(event.currentTarget.valueAsNumber || 0)}
              style={{ width: 64 }}
            />
          </label>
          <label>
            Origin Y{" "}
            <input
              aria-label="Origin Y"
              type="number"
              value={y}
              onChange={(event) => setY(event.currentTarget.valueAsNumber || 0)}
              style={{ width: 64 }}
            />
          </label>
        </div>
        <SkeletonGroup
          animated={animated}
          sparkleOptions={{ duration: 2400, ...sparkleOptions, origin: [x, y] }}
          role="status"
          aria-label="Loading panels"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <Skeleton variant="rect" height={80} />
          <Skeleton variant="rect" height={80} />
        </SkeletonGroup>
      </section>
    );
  },
};

export const SeparateGroups: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {[1, 2].map((id) => (
        <SkeletonGroup
          key={id}
          role="status"
          aria-label={`Loading card ${id}`}
          style={{ display: "grid", gap: 12 }}
          sparkleOptions={{ seed: id }}
        >
          <Skeleton variant="rect" height={80} />
          <Skeleton width="75%" />
          <Skeleton />
        </SkeletonGroup>
      ))}
    </div>
  ),
};

export const DynamicGroup: Story = {
  render: function Example({ animated, sparkleOptions }) {
    const [second, setSecond] = useState(false);
    const [wide, setWide] = useState(true);
    return (
      <section>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Button effect="none" onClick={() => setSecond((value) => !value)}>
            {second ? "Remove second box" : "Add second box"}
          </Button>
          <Button effect="none" onClick={() => setWide((value) => !value)}>
            Resize group
          </Button>
        </div>
        <SkeletonGroup
          animated={animated}
          sparkleOptions={sparkleOptions}
          role="status"
          aria-label="Loading panels"
          style={{
            width: wide ? 400 : 260,
            maxWidth: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <Skeleton variant="rect" height={80} />
          {second && <Skeleton variant="circle" width={80} />}
        </SkeletonGroup>
      </section>
    );
  },
};
