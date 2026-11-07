# Button loading

Promise-returning `onClick` handlers automatically enter loading until they
settle. An immediate ref gate blocks duplicate native, pointer and keyboard
activation before React commits. Automatic feedback lasts at least 150ms so a
fast request still receives visible feedback; `minLoadingDuration={0}` removes
that minimum. The handler continues to own failure feedback. Return the work's
Promise rather than starting it with `void` when the button should wait.

`loading` also remains available for externally managed work. The label stays in
place, holds the same scale as a pressed button, and receives a soft moving
highlight without adding padding or changing the button's layout.

```tsx
<Button loading={saving} onClick={save}>
  Save changes
</Button>
```

While loading, the button exposes `aria-busy` and `aria-disabled`, retains focus,
and ignores click activation (including keyboard activation and form submission
through that button). Native `disabled` remains available independently.
The caller sets an explicit `loading` back to `false` when that work finishes or
fails.

The highlight clips to text, including nested labels. SVG icons retain their
original color; icon-only buttons show the held press scale and busy semantics.
With reduced motion enabled, the text keeps its original color and the scale is
held without a transition or repeating highlight.

Override `--ui-button-loading-duration` to change the sweep period (default
`1600ms`). Storybook's **Button → Loading Interaction** demonstrates starting
and finishing an operation; static loading, long label, icon and toolbar examples
are also available.
