import { describe, expect, it } from "vitest";
import {
  moveSplits,
  alignedSplitIds,
  snapSplitMove,
  splitPeers,
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

describe("opposing dividers", () => {
  const left = measured("left", "vertical", {
    left: 100,
    top: 197.5,
    width: 247.5,
    height: 5,
  });
  it("groups aligned opposing segments but leaves a detached side independent", () => {
    const peers = splitPeers([vertical, horizontal, left]);
    expect(peers).toHaveLength(1);
    expect(alignedSplitIds(["left"], peers)).toEqual(["left", "right"]);
    expect(alignedSplitIds(["outer"], peers)).toEqual(["outer"]);
    expect(alignedSplitIds(["left"], peers, new Set(["left"]))).toEqual([
      "left",
    ]);
    expect(splitPeers([horizontal, left])).toEqual([]);
  });
  it("does not group offset or merely nearby parallel dividers", () => {
    const offset = { ...left, handle: { ...left.handle, top: 190 } };
    const peers = splitPeers([vertical, horizontal, offset]);
    expect(peers).toHaveLength(1);
    expect(alignedSplitIds(["left"], peers)).toEqual(["left"]);
    expect(
      splitPeers([
        vertical,
        horizontal,
        { ...left, handle: { ...left.handle, width: 230 } },
      ]),
    ).toEqual([]);
  });
  it("discovers the same grouping with vertical segments across a horizontal gutter", () => {
    const wall = measured("wall", "vertical", {
      left: 100,
      top: 197.5,
      width: 500,
      height: 5,
    });
    const a = measured("a", "horizontal", {
      left: 347.5,
      top: 50,
      width: 5,
      height: 147.5,
    });
    const b = measured("b", "horizontal", {
      left: 347.5,
      top: 202.5,
      width: 5,
      height: 147.5,
    });
    expect(alignedSplitIds(["a"], splitPeers([wall, a, b]))).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("snap displacement", () => {
  const targets = [
    { id: "left", axis: "vertical" as const, ratio: 0.35, size: 500 },
  ];
  const peers = [
    {
      axis: "vertical" as const,
      a: "left",
      b: "right",
      aPosition: 175,
      bPosition: 325,
    },
  ];
  it("enters nearby, holds through jitter and releases further away", () => {
    const entered = snapSplitMove(targets, peers, 0, 143, 10, 16);
    expect(entered.changes[0].ratio).toBeCloseTo(0.65);
    expect(entered.ids).toEqual(["left", "right"]);
    expect(
      snapSplitMove(targets, peers, 0, 161, 10, 16, entered.snaps).changes[0]
        .ratio,
    ).toBeCloseTo(0.65);
    expect(
      snapSplitMove(targets, peers, 0, 167, 10, 16, entered.snaps).changes[0]
        .ratio,
    ).toBeCloseTo(0.684);
    expect(snapSplitMove(targets, peers, 0, 161, 10, 16).ids).toEqual([]);
  });
  it("does not snap to an unreachable target or a moving peer", () => {
    const outside = [{ ...peers[0], bPosition: 427.5 }];
    expect(
      snapSplitMove(targets, outside, 0, 245, 10, 16).changes[0].ratio,
    ).toBeCloseTo(0.84);
    const nearLimit = [{ ...peers[0], bPosition: 420 }];
    expect(snapSplitMove(targets, nearLimit, 0, 1000, 10, 16).ids).toEqual([]);
    expect(
      snapSplitMove(
        [...targets, { id: "right", axis: "vertical", ratio: 0.65, size: 500 }],
        peers,
        0,
        143,
        10,
        16,
      ).ids,
    ).toEqual([]);
  });
  it("can disable snapping for detachment without affecting movement", () => {
    expect(
      snapSplitMove(targets, peers, 0, 143, 0, 16).changes[0].ratio,
    ).toBeCloseTo(0.636);
    expect(snapSplitMove(targets, peers, 0, 143, 0, 16).ids).toEqual([]);
  });
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
