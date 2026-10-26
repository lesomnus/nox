# Popover

`Popover` shows text or React content on hover and keyboard focus, using a portal
that escapes clipped containers. It replaces the former OverflowHint name.

```tsx
<Popover content="Full value">Short value</Popover>
<Popover content={<><CompactNumber value={12345} /> /workspace/report.md</>}>
  report.md
</Popover>
```

`placement` supports top, bottom, left and right, with start/end alignment.
The preferred position flips and shifts within the viewport. `adjacent` chooses
below first; `in-place` aligns the content's first text line with the original
text and hides the original while the overlay is visible. Scrolling, resizing,
Escape and leaving the unfocused trigger dismiss the popover.

For an existing DOM trigger, provide `anchor`, `open` and `onOpenChange` instead
of children. The host controls pointer/focus behavior and visibility. Popover
preserves the trigger's existing accessible description, adds its own while
visible and removes it on dismissal. Content uses `tooltip` semantics.

```tsx
<Popover
  anchor={linkElement}
  open={showDetails}
  onOpenChange={setShowDetails}
  content={<FileDetails />}
/>
```

Rich content updates are remeasured without replacing the trigger. Content in
an open native dialog is portaled into that dialog's top layer. Appearance is
shared through the `--ui-popover-background` theme token.
