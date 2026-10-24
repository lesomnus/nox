export type SplitNode =
  | { kind: "pane"; id: string }
  | {
      kind: "split";
      id: string;
      axis: "horizontal" | "vertical";
      ratio: number;
      first: SplitNode;
      second: SplitNode;
    };

export const minRatio = 0.15;
export const maxRatio = 0.85;
export const boundRatio = (ratio: number) =>
  Math.max(minRatio, Math.min(maxRatio, ratio));

export function setSplitRatio(
  node: SplitNode,
  id: string,
  ratio: number,
): SplitNode {
  if (node.kind === "pane") return node;
  if (node.id === id) return { ...node, ratio: boundRatio(ratio) };
  return {
    ...node,
    first: setSplitRatio(node.first, id, ratio),
    second: setSplitRatio(node.second, id, ratio),
  };
}

type Rect = Pick<DOMRect, "left" | "top" | "width" | "height">;
export type MeasuredSplit = {
  node: Extract<SplitNode, { kind: "split" }>;
  handle: Rect;
};
export type Junction = {
  id: string;
  ids: string[];
  x: number;
  y: number;
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
};

/** Join touching centerlines across their gutters; coalesce four-way crossings. */
export function splitJunctions(
  splits: MeasuredSplit[],
  root: Rect,
): Junction[] {
  if (!root.width || !root.height) return [];
  const junctions: Junction[] = [];
  for (const vertical of splits.filter(
    (split) => split.node.axis === "horizontal",
  )) {
    for (const horizontal of splits.filter(
      (split) => split.node.axis === "vertical",
    )) {
      const v = vertical.handle,
        h = horizontal.handle;
      const x = v.left + v.width / 2,
        y = h.top + h.height / 2;
      if (
        x < h.left - v.width / 2 - 0.5 ||
        x > h.left + h.width + v.width / 2 + 0.5 ||
        y < v.top - h.height / 2 - 0.5 ||
        y > v.top + v.height + h.height / 2 + 0.5
      )
        continue;
      let joint = junctions.find(
        (j) => Math.abs(j.x - x) < 0.5 && Math.abs(j.y - y) < 0.5,
      );
      if (!joint) {
        joint = {
          id: "",
          ids: [],
          x,
          y,
          left: false,
          right: false,
          top: false,
          bottom: false,
        };
        junctions.push(joint);
      }
      for (const id of [vertical.node.id, horizontal.node.id])
        if (!joint.ids.includes(id)) joint.ids.push(id);
      joint.left ||= h.left < x;
      joint.right ||= h.left + h.width > x;
      joint.top ||= v.top < y;
      joint.bottom ||= v.top + v.height > y;
    }
  }
  return junctions.map((j) => ({
    ...j,
    id: JSON.stringify(j.ids.sort()),
    x: ((j.x - root.left) / root.width) * 100,
    y: ((j.y - root.top) / root.height) * 100,
  }));
}

export type SplitDrag = {
  id: string;
  axis: "horizontal" | "vertical";
  ratio: number;
  size: number;
};

/** A shared pixel delta keeps aligned branches together, including at limits. */
export function moveSplits(targets: SplitDrag[], dx: number, dy: number) {
  const movement = { horizontal: dx, vertical: dy };
  for (const axis of ["horizontal", "vertical"] as const) {
    const group = targets.filter((t) => t.axis === axis && t.size > 0);
    if (!group.length) continue;
    const low = Math.max(...group.map((t) => (minRatio - t.ratio) * t.size));
    const high = Math.min(...group.map((t) => (maxRatio - t.ratio) * t.size));
    movement[axis] = Math.max(low, Math.min(high, movement[axis]));
  }
  return targets
    .filter((t) => t.size > 0)
    .map((t) => ({
      id: t.id,
      ratio: boundRatio(t.ratio + movement[t.axis] / t.size),
    }));
}
