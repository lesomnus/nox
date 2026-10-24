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

export function findSplit(
  node: SplitNode,
  id: string,
): Extract<SplitNode, { kind: "split" }> | undefined {
  if (node.kind === "pane") return undefined;
  return node.id === id
    ? node
    : (findSplit(node.first, id) ?? findSplit(node.second, id));
}

/** Rotate an aligned four-pane crossing without changing or duplicating any pane. */
export function detachCrossing(
  node: SplitNode,
  id: string,
  secondId: string,
  tolerance = 1e-6,
): { node: SplitNode; first: string; second: string } | undefined {
  const split = findSplit(node, id);
  if (
    !split ||
    split.first.kind !== "split" ||
    split.second.kind !== "split" ||
    split.first.axis === split.axis ||
    split.second.axis !== split.first.axis ||
    Math.abs(split.first.ratio - split.second.ratio) > tolerance
  )
    return undefined;
  const first = split.first,
    second = split.second;
  const rotated: SplitNode = {
    kind: "split",
    id: first.id,
    axis: first.axis,
    ratio: (first.ratio + second.ratio) / 2,
    first: {
      kind: "split",
      id: split.id,
      axis: split.axis,
      ratio: split.ratio,
      first: first.first,
      second: second.first,
    },
    second: {
      kind: "split",
      id: secondId,
      axis: split.axis,
      ratio: split.ratio,
      first: first.second,
      second: second.second,
    },
  };
  const replace = (current: SplitNode): SplitNode =>
    current.id === id
      ? rotated
      : current.kind === "pane"
        ? current
        : {
            ...current,
            first: replace(current.first),
            second: replace(current.second),
          };
  return { node: replace(node), first: split.id, second: secondId };
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

export type SplitPeer = {
  axis: SplitDrag["axis"];
  a: string;
  b: string;
  aPosition: number;
  bPosition: number;
};

/** Parallel segments ending on opposite sides of the same perpendicular gutter. */
export function splitPeers(splits: MeasuredSplit[]): SplitPeer[] {
  const peers: SplitPeer[] = [];
  for (let i = 0; i < splits.length; i++) {
    const a = splits[i];
    for (const b of splits.slice(i + 1)) {
      if (a.node.axis !== b.node.axis) continue;
      const vertical = a.node.axis === "horizontal";
      const aPosition = vertical
        ? a.handle.left + a.handle.width / 2
        : a.handle.top + a.handle.height / 2;
      const bPosition = vertical
        ? b.handle.left + b.handle.width / 2
        : b.handle.top + b.handle.height / 2;
      const aStart = vertical ? a.handle.top : a.handle.left;
      const bStart = vertical ? b.handle.top : b.handle.left;
      const aEnd = aStart + (vertical ? a.handle.height : a.handle.width);
      const bEnd = bStart + (vertical ? b.handle.height : b.handle.width);
      const opposite = splits.some((wall) => {
        if (wall.node.axis === a.node.axis) return false;
        const start = vertical ? wall.handle.top : wall.handle.left;
        const end = start + (vertical ? wall.handle.height : wall.handle.width);
        const low = vertical ? wall.handle.left : wall.handle.top;
        const high = low + (vertical ? wall.handle.width : wall.handle.height);
        return (
          ((Math.abs(aEnd - start) < 0.5 && Math.abs(bStart - end) < 0.5) ||
            (Math.abs(bEnd - start) < 0.5 && Math.abs(aStart - end) < 0.5)) &&
          aPosition >= low - 0.5 &&
          aPosition <= high + 0.5 &&
          bPosition >= low - 0.5 &&
          bPosition <= high + 0.5
        );
      });
      if (opposite)
        peers.push({
          axis: a.node.axis,
          a: a.node.id,
          b: b.node.id,
          aPosition,
          bPosition,
        });
    }
  }
  return peers;
}

export function alignedSplitIds(
  ids: string[],
  peers: SplitPeer[],
  detached: ReadonlySet<string> = new Set(),
): string[] {
  const group = new Set(ids);
  let changed = true;
  while (changed) {
    changed = false;
    for (const peer of peers) {
      if (
        Math.abs(peer.aPosition - peer.bPosition) >= 0.5 ||
        detached.has(peer.a) ||
        detached.has(peer.b)
      )
        continue;
      if (group.has(peer.a) === group.has(peer.b)) continue;
      group.add(peer.a);
      group.add(peer.b);
      changed = true;
    }
  }
  return [...group].sort();
}

type SnapLock = { a: string; b: string; delta: number };
export type SplitSnaps = Partial<Record<SplitDrag["axis"], SnapLock>>;

/** Snap the displacement, not the pointer, and hold it through a wider release zone. */
export function snapSplitMove(
  targets: SplitDrag[],
  peers: SplitPeer[],
  dx: number,
  dy: number,
  distance: number,
  releaseDistance: number,
  previous: SplitSnaps = {},
) {
  const movement = { horizontal: dx, vertical: dy };
  const snaps: SplitSnaps = {};
  const moving = new Set(targets.map((target) => target.id));
  if (distance > 0)
    for (const axis of ["horizontal", "vertical"] as const) {
      const group = targets.filter(
        (target) => target.axis === axis && target.size > 0,
      );
      if (!group.length) continue;
      const delta = movement[axis];
      const candidates = peers
        .filter(
          (peer) =>
            peer.axis === axis && moving.has(peer.a) !== moving.has(peer.b),
        )
        .map((peer) => ({
          a: peer.a,
          b: peer.b,
          delta: moving.has(peer.a)
            ? peer.bPosition - peer.aPosition
            : peer.aPosition - peer.bPosition,
        }))
        .filter((candidate) =>
          group.every((target) => {
            const ratio = target.ratio + candidate.delta / target.size;
            return ratio >= minRatio - 1e-9 && ratio <= maxRatio + 1e-9;
          }),
        );
      const last = previous[axis];
      const held =
        last &&
        candidates.find(
          (candidate) =>
            candidate.a === last.a &&
            candidate.b === last.b &&
            Math.abs(candidate.delta - delta) <=
              Math.max(distance, releaseDistance),
        );
      const closest =
        held ??
        candidates
          .filter((candidate) => Math.abs(candidate.delta - delta) <= distance)
          .sort(
            (a, b) => Math.abs(a.delta - delta) - Math.abs(b.delta - delta),
          )[0];
      if (closest) {
        snaps[axis] = closest;
        movement[axis] = closest.delta;
      }
    }
  return {
    changes: moveSplits(targets, movement.horizontal, movement.vertical),
    snaps,
    ids: [...new Set(Object.values(snaps).flatMap((snap) => [snap.a, snap.b]))],
  };
}

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
