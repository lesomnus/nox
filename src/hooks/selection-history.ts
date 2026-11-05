export type SelectionCheckpoint<Key> = {
  selected: ReadonlySet<Key>;
  anchor?: Key;
};
export type SelectionCommit<Key> = {
  before: SelectionCheckpoint<Key>;
  after: SelectionCheckpoint<Key>;
};
export function sameSelection<Key>(a: ReadonlySet<Key>, b: ReadonlySet<Key>) {
  return a.size === b.size && [...a].every((key) => b.has(key));
}
const copy = <Key>(
  state: SelectionCheckpoint<Key>,
): SelectionCheckpoint<Key> => ({
  selected: new Set(state.selected),
  anchor: state.anchor,
});

export class SelectionHistory<Key> {
  private past: SelectionCommit<Key>[] = [];
  private future: SelectionCommit<Key>[] = [];
  private pending?: SelectionCheckpoint<Key>;
  private limit = 100;
  get enabled() {
    return this.limit > 0;
  }
  get canUndo() {
    return this.past.length > 0;
  }
  get canRedo() {
    return this.future.length > 0;
  }
  setLimit(value = 100) {
    const limit = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 100;
    if (limit === this.limit) return false;
    this.limit = limit;
    if (!limit) return this.clear();
    const changed = this.past.length > limit || this.future.length > limit;
    this.past = this.past.slice(-limit);
    this.future = this.future.slice(-limit);
    return changed;
  }
  begin(state: SelectionCheckpoint<Key>) {
    if (this.enabled && !this.pending) this.pending = copy(state);
  }
  hasPendingChange(selected: ReadonlySet<Key>) {
    return !!this.pending && !sameSelection(this.pending.selected, selected);
  }
  commit(state: SelectionCheckpoint<Key>) {
    const before = this.pending;
    this.pending = undefined;
    if (
      !before ||
      !this.enabled ||
      sameSelection(before.selected, state.selected)
    )
      return false;
    this.past.push({ before, after: copy(state) });
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
    return true;
  }
  undo() {
    const entry = this.past.pop();
    if (entry) this.future.push(entry);
    return entry;
  }
  redo() {
    const entry = this.future.pop();
    if (entry) this.past.push(entry);
    return entry;
  }
  clear() {
    const changed = !!(this.past.length || this.future.length || this.pending);
    this.past = [];
    this.future = [];
    this.pending = undefined;
    return changed;
  }
}
