# Range selection

`useRangeSelection` provides controlled checkbox selection for tables and lists.
It works with Nox `Checkbox` or a compatible component that forwards input props.
The hook owns interaction state; the caller owns the selected keys.

```tsx
const [selected, select] = useState<Set<string>>(() => new Set());
const selection = useRangeSelection({
  items: rows.map((row) => row.id),
  selected,
  onSelectionChange: select,
  disabled: loading,
  isItemDisabled: (id) => lockedIds.has(id),
});

<div {...selection.getContainerProps()}>
  <Checkbox aria-label="Select all" {...selection.getSelectAllProps()} />
  {rows.map((row) => (
    <Checkbox
      key={row.id}
      aria-label={`Select ${row.name}`}
      {...selection.getCheckboxProps(row.id)}
    />
  ))}
</div>;
```

Supply unique string or number keys in display order. Keep `selected` controlled
and apply `onSelectionChange` synchronously. The returned props include checked,
disabled and event handlers; the header props also include indeterminate state.
Keep the handlers together so the native release click does not toggle a second
time. Labels, checkbox appearance and row highlighting remain caller-owned.

- Primary mouse/pen down immediately toggles the pressed item and establishes an
  anchor. The selected keys are snapshotted before the toggle. Dragging applies
  that same checked or unchecked value to the inclusive start-to-pointer range,
  including keys skipped by fast movement. Shrinking the range restores each
  departing item's original value from the snapshot. Wheel scrolling continues
  updating the range under the pointer.
- Pressing Shift snapshots the selection for that entire held-key session. The
  first Shift activation chooses check or clear mode; later clicks or Space
  activations keep that mode and update the endpoint from the same non-Shift
  anchor. Shrinking restores items from the Shift-down snapshot, including mixed
  original values. Releasing Shift commits the result; the next Shift press
  starts a fresh snapshot. Unrelated selections outside the range are preserved.
- Native Space, Shift-Space, assistive/programmatic activation and touch clicks
  keep their normal input behavior. Keyboard activation can establish the anchor
  and extend ranges. Pointer painting does not take over touch scrolling.
- Disabled items are skipped and keep their existing values. Select-all acts on
  enabled keys in the supplied scope. It resets the range anchor and preserves
  selections outside that scope.
- Reordering/removing items or disabling selection stops an active drag. Anchors
  use keys rather than saved indexes and survive sorting while the key remains.
  Pointer up/cancel releases drag listeners and pointer capture. Keyboard-session
  listeners are removed on unmount; window blur also ends the Shift snapshot.
  Separate hook instances are isolated, even when they use identical item keys.

The hook adds scoped data attributes to the input for pointer hit testing, and
needs no table component or row wrapper. Attach its props to each rendered
checkbox target, including full-cell checkbox hit areas.

## Undo and redo

Spread `getContainerProps()` on the table or list's containing element. While
focus is inside this scope, Ctrl+Z undoes selection and Ctrl+Shift+Z redoes it
(Command also works). Clicking a non-interactive cell focuses the scope without
adding a tab stop. Text inputs, textareas and editable content retain native undo.
Nested or independent selection scopes handle only their own history.

A primary pointer down through up is one commit, including every drag preview.
Shift down through up groups all clicks and Space activations into one commit;
nested pointer gestures do not split it. Other native checkbox activations and
select-all each create their own commit. Blur or cancellation finalizes the current
selection. Undo during a gesture ends it before restoring the previous state.

Only changed selection sets create records. A no-op gesture preserves redo;
a new changed commit after undo clears redo. History also restores the range
anchor. Removed or disabled items are skipped when replaying a commit, and keys
outside the current scope are preserved.

`undo()` and `redo()` return whether a record was applied. `canUndo` and `canRedo`
can drive buttons; `clearHistory()` discards records without changing selection.
`historyLimit` bounds the number of local commits; set it to zero to disable
history. Records live only in the mounted hook, with no browser persistence.
External controlled selection replacements clear history and end active gestures.
Ordinary controlled updates from `onSelectionChange` preserve it.

```tsx
<Button disabled={!selection.canUndo} onClick={selection.undo}>Undo</Button>
<Button disabled={!selection.canRedo} onClick={selection.redo}>Redo</Button>
```

See **Components/Table → Range Selection** and **Independent Ranges** for live
examples. The existing Selectable table also uses this hook.
