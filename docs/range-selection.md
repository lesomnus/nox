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

<Checkbox aria-label="Select all" {...selection.getSelectAllProps()} />;
{
  rows.map((row) => (
    <Checkbox
      key={row.id}
      aria-label={`Select ${row.name}`}
      {...selection.getCheckboxProps(row.id)}
    />
  ));
}
```

Supply unique string or number keys in display order. Keep `selected` controlled
and apply `onSelectionChange` synchronously. The returned props include checked,
disabled and event handlers; the header props also include indeterminate state.
Keep the handlers together so the native release click does not toggle a second
time. Labels, checkbox appearance and row highlighting remain caller-owned.

- Primary mouse/pen down immediately toggles the pressed item and establishes an
  anchor. Holding the pointer and passing through other checkbox targets paints
  the same checked or unchecked value. Crossed items are filled even when pointer
  movement skips DOM targets. Reversing direction does not toggle painted items
  again. Wheel scrolling during a drag continues selection under the pointer.
- Shift-click applies the destination checkbox's new checked value to the
  inclusive anchor-to-destination range. The anchor remains the last non-Shift
  activation, so repeated Shift actions use the same starting item. Selections
  outside the range are preserved.
- Native Space, Shift-Space, assistive/programmatic activation and touch clicks
  keep their normal input behavior. Keyboard activation can establish the anchor
  and extend ranges. Pointer painting does not take over touch scrolling.
- Disabled items are skipped and keep their existing values. Select-all acts on
  enabled keys in the supplied scope. It resets the range anchor and preserves
  selections outside that scope.
- Reordering/removing items or disabling selection stops an active drag. Anchors
  use keys rather than saved indexes and survive sorting while the key remains.
  Pointer up/cancel, window blur and unmount release listeners and pointer capture.
  Separate hook instances are isolated, even when they use identical item keys.

The hook adds scoped data attributes to the input for pointer hit testing, and
needs no table component or row wrapper. Attach its props to each rendered
checkbox target, including full-cell checkbox hit areas.

See **Components/Table → Range Selection** and **Independent Ranges** for live
examples. The existing Selectable table also uses this hook.
