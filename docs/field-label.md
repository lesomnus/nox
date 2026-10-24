# FieldLabel help placement

`helpPlacement` positions the description tooltip relative to its Help icon.
The default, `top-start`, puts the tooltip's bottom-left corner above the icon's
left edge, separated by the tooltip inset (8px by default).

```tsx
<FieldLabel label="Status" description="Current workspace state." />
<FieldLabel label="Status" description="Current workspace state."
  helpPlacement="bottom-end" />
```

Supported positions are `top`, `bottom`, `left` and `right`, each optionally
suffixed with `-start` or `-end`. Without a suffix, the tooltip is centered on
the icon. For top/bottom, start and end align left/right edges; for left/right,
they align top/bottom edges.

The position is a preference: when there is insufficient space, the tooltip
flips to the opposite side if it offers more room, then shifts inside the
viewport. Help still opens on hover or keyboard focus and closes on Escape,
blur, scrolling or resizing. It is portaled outside clipped containers.
Without a description, no Help icon or tooltip is rendered.

`FieldLabelProps`, `OverflowHintPosition` and `OverflowHintPlacement` are public
types. `OverflowHint` accepts the same positions through `placement` and also
defaults to `top-start`:

```tsx
<OverflowHint content="Full value">Short value</OverflowHint>
<OverflowHint content="Full value" placement="right">Short value</OverflowHint>
```

Explicit `placement="adjacent"` preserves the previous automatic below-first
positioning, and `placement="in-place"` preserves the text overlay behavior.

Storybook **FieldLabel → With Help** has a placement selector; **Bottom End**,
**Right** and **Viewport Edges** show explicit positioning and viewport fallback.
**OverflowHint** also has placement controls, **Bottom End**, **Right**,
**Viewport Edge**, **Adjacent** and **In Place** examples.
