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
  const inset = Math.max(0,
    trigger.getBoundingClientRect().top - toolbar.getBoundingClientRect().top - border,
  );
  return 2 * inset + border;
}

<ActionMenu placement="above" gap={mirroredToolbarGap} label="More" items={items} />
```

Use `position` for custom origins such as panel-relative right-side alignment.
Anchor the popup's near edge directly where possible, so changes in content
height do not change the gap. Viewport bounds and access to menu items take
priority over exact symmetry when space is limited.

## Concentric nested corners

For uniformly inset rounded controls, prefer an outer corner radius equal to
the inner radius plus padding and border thickness. Keep actual measurements
in the CSS tokens rather than duplicating them as independent constants.
