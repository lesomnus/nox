import { describe, expect, it } from "vitest";
import {
  moveSplits,
  splitJunctions,
  type MeasuredSplit,
} from "./split-layout-model";

const root = { left: 100, top: 50, width: 500, height: 300 };
const measured = (
  id: string,
  axis: "horizontal" | "vertical",
  handle: MeasuredSplit["handle"],
): MeasuredSplit => ({
  node: {
    kind: "split",
    id,
    axis,
    ratio: 0.5,
    first: { kind: "pane", id: "a" },
    second: { kind: "pane", id: "b" },
  },
  handle,
});
const vertical = measured("outer", "horizontal", {
  left: 347.5,
  top: 50,
  width: 5,
  height: 300,
});
const horizontal = measured("right", "vertical", {
  left: 352.5,
  top: 197.5,
  width: 247.5,
  height: 5,
});

describe("split junctions", () => {
  it("bridges a T to the parent centerline with only its actual arms", () => {
    expect(splitJunctions([vertical, horizontal], root)).toEqual([
      {
        id: '["outer","right"]',
        ids: ["outer", "right"],
        x: 50,
        y: 50,
        left: false,
        right: true,
        top: true,
        bottom: true,
      },
    ]);
  });
  it("coalesces aligned branches into one four-way drag target", () => {
    const left = measured("left", "vertical", {
      left: 100,
      top: 197.5,
      width: 247.5,
      height: 5,
    });
    const [junction] = splitJunctions([vertical, horizontal, left], root);
    expect(junction).toMatchObject({
      ids: ["left", "outer", "right"],
      left: true,
      right: true,
      top: true,
      bottom: true,
    });
    expect(splitJunctions([vertical, horizontal, left], root)).toHaveLength(1);
  });
  it("keeps offset T junctions independent and excludes distant separators", () => {
    const left = measured("left", "vertical", {
      left: 100,
      top: 97.5,
      width: 247.5,
      height: 5,
    });
    expect(splitJunctions([vertical, horizontal, left], root)).toHaveLength(2);
    const distant = {
      ...horizontal,
      handle: { ...horizontal.handle, left: 360 },
    };
    expect(splitJunctions([vertical, distant], root)).toEqual([]);
    expect(
      splitJunctions([vertical, horizontal], { ...root, width: 0 }),
    ).toEqual([]);
  });
});

describe("joint resizing", () => {
  const targets = [
    { id: "x", axis: "horizontal" as const, ratio: 0.5, size: 500 },
    { id: "y", axis: "vertical" as const, ratio: 0.5, size: 300 },
  ];
  it("uses displacement from the grab position without a first-move jump", () => {
    expect(moveSplits(targets, 0, 0)).toEqual([
      { id: "x", ratio: 0.5 },
      { id: "y", ratio: 0.5 },
    ]);
    expect(moveSplits(targets, 50, -60)).toEqual([
      { id: "x", ratio: 0.6 },
      { id: "y", ratio: 0.3 },
    ]);
  });
  it("bounds each axis independently and resumes when dragged back", () => {
    const limited = moveSplits(targets, 10000, -10000);
    expect(limited[0].ratio).toBeCloseTo(0.85);
    expect(limited[1].ratio).toBeCloseTo(0.15);
    expect(moveSplits(targets, 50, -60)).toEqual([
      { id: "x", ratio: 0.6 },
      { id: "y", ratio: 0.3 },
    ]);
  });
  it("limits a shared pixel delta to the tightest branch to preserve alignment", () => {
    const changes = moveSplits(
      [
        { id: "a", axis: "vertical", ratio: 0.5, size: 300 },
        { id: "b", axis: "vertical", ratio: 0.6, size: 200 },
      ],
      0,
      10000,
    );
    expect(changes[0].ratio).toBeCloseTo(0.5 + 50 / 300);
    expect(changes[1].ratio).toBeCloseTo(0.85);
  });
});
