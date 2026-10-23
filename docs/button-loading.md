# Button loading

`loading` is controlled by the caller. The label stays in place, holds the same
scale as a pressed button, and receives a soft moving highlight without adding
padding or changing the button's layout.

```tsx
<Button loading={saving} onClick={save}>
  Save changes
</Button>
```

While loading, the button exposes `aria-busy` and `aria-disabled`, retains focus,
and ignores click activation (including keyboard activation and form submission
through that button). Native `disabled` remains available independently.
The caller sets `loading` back to `false` when the operation finishes or fails.

The highlight clips to text, including nested labels. SVG icons retain their
original color; icon-only buttons show the held press scale and busy semantics.
With reduced motion enabled, the text keeps its original color and the scale is
held without a transition or repeating highlight.

Override `--ui-button-loading-duration` to change the sweep period (default
`1600ms`). Storybook's **Button → Loading Interaction** demonstrates starting
and finishing an operation; static loading, long label, icon and toolbar examples
are also available.
