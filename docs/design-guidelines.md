# Design guidelines

## Mirror spacing across container edges

When a button inside a toolbar or panel opens an adjacent popup, prefer equal
spacing on either side of the container edge: the button's inset inside the
container should match the popup's gap outside it. Measure from the visible
facing border edges: exclude the container border from the inner empty space,
and measure the outer gap from the outside of that border. This is a recommendation for
adjacent popups, not a rule for centered modals.

For a popup above a toolbar:

- Inner inset = button top − toolbar top − toolbar top border width.
- Outer gap = toolbar top − popup bottom.
- Prefer outer gap = inner inset.

For a popup to the right of a panel:

- Inner inset = panel right − panel right border width − button right.
- Outer gap = popup left − panel right.
- Prefer outer gap = inner inset, with popup top aligned to button top.

Use current geometry rather than copying padding values into application code.
For `ActionMenu`, `gap` measures the distance from the trigger itself, so the
above-toolbar case uses twice the inner inset plus the intervening border:

```tsx
function mirroredToolbarGap(trigger: HTMLButtonElement) {
  const toolbar = trigger.closest(".toolbar");
  if (!toolbar) return 4;
  const border = parseFloat(getComputedStyle(toolbar).borderTopWidth) || 0;
  const inset = Math.max(
    0,
    trigger.getBoundingClientRect().top -
      toolbar.getBoundingClientRect().top -
      border,
  );
  return 2 * inset + border;
}

<ActionMenu
  placement="above"
  gap={mirroredToolbarGap}
  label="More"
  items={items}
/>;
```

Use `position` for custom origins such as panel-relative right-side alignment.
Anchor the popup's near edge directly where possible, so changes in content
height do not change the gap. Viewport bounds and access to menu items take
priority over exact symmetry when space is limited.

## Concentric nested corners

For uniformly inset rounded controls, prefer an outer corner radius equal to
the inner radius plus padding and border thickness. Keep actual measurements
in the CSS tokens rather than duplicating them as independent constants.

## Fixed-width numeric displays

Use shared numeric components rather than formatting metrics independently.
Keep significant digits at the normal foreground brightness, padding zeroes
at `--ui-shade-65`, and units at the intermediate brightness used by
`CompactNumber` (78% foreground mixed with the background). Use tabular
monospace digits and stable slots so changing values do not shift nearby UI.
`DurationDisplay` renders nine cells as `00d00h00m`, with the padding zero in
each field dimmed and each unit at intermediate brightness. Actual zero values
remain readable, except a zero day field: dim the entire `00d`, including its unit. Use `rounding="ceil"` for remaining time; callers own the clock.
Unknown values render `--d--h--m`; values of 100 days or more render
`++d--h--m` without widening the display. Accessible labels retain the value.

## Popup reveal motion

Use `DialogReveal` for custom popup surfaces that need the same effect as
`ActionMenu`'s `effect: "reveal"`. The outer frame stays on its final pixel grid
and fades in; only its contents receive the directional mask, subtle motion
and blur. Do not introduce a separate clip-path wipe or animate thin borders.
Both use the shared reveal duration/easing and respect reduced motion.


## In-place overlays

An **in-place overlay** expands a value at its existing text origin and baseline,
keeping its typography. Use this term for selected ValueMenu rows and expanded
identifier hints; align the actual text rather than the surrounding box.
`OverflowHint` supports `placement="in-place"`. It uses a portal to escape container
clipping and wraps long values at the viewport edge while keeping the text origin
fixed. Adjacent hints remain available through the default placement.
