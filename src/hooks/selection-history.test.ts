import { expect, test } from "vitest";
import { SelectionHistory } from "./selection-history";
const state = (keys: number[], anchor?: number) => ({
  selected: new Set(keys),
  anchor,
});

test("overlapping gestures keep one initial checkpoint and one final state", () => {
  const history = new SelectionHistory<number>();
  history.begin(state([], 1));
  history.begin(state([1], 3));
  history.commit(state([1, 2, 3], 1));
  expect(history.undo()).toEqual({
    before: state([], 1),
    after: state([1, 2, 3], 1),
  });
  expect(history.canUndo).toBe(false);
  expect(history.redo()?.after).toEqual(state([1, 2, 3], 1));
});
test("no-op gestures preserve redo while a new changed commit clears it", () => {
  const history = new SelectionHistory<number>();
  history.begin(state([]));
  history.commit(state([1]));
  history.undo();
  history.begin(state([]));
  expect(history.hasPendingChange(new Set([2]))).toBe(true);
  expect(history.commit(state([]))).toBe(false);
  expect(history.canRedo).toBe(true);
  history.begin(state([]));
  history.commit(state([3]));
  expect(history.canRedo).toBe(false);
});
test("committed snapshots do not share the caller's mutable Sets", () => {
  const history = new SelectionHistory<number>(),
    before = state([1], 1),
    after = state([1, 2], 2);
  history.begin(before);
  before.selected.add(8);
  history.commit(after);
  after.selected.clear();
  expect(history.undo()).toEqual({
    before: state([1], 1),
    after: state([1, 2], 2),
  });
});
test("history bounds old records and can be disabled without retaining a pending gesture", () => {
  const history = new SelectionHistory<number>();
  history.setLimit(2);
  for (let i = 0; i < 3; i++) {
    history.begin(state([i]));
    history.commit(state([i + 1]));
  }
  expect(history.undo()?.before).toEqual(state([2]));
  expect(history.undo()?.before).toEqual(state([1]));
  expect(history.undo()).toBeUndefined();
  history.begin(state([0]));
  history.setLimit(0);
  history.commit(state([5]));
  expect(history.canUndo).toBe(false);
  expect(history.canRedo).toBe(false);
});
