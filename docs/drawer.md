# Drawer and Card

`Drawer` extracts the modal placement and motion of cxz's task-detail view.
`Card` is its separate rounded, translucent card with a compact heading,
inset body and optional footer. Neither component knows about sessions or tasks.

```tsx
import { Drawer, Card, ScrollArea } from "@lesomnus/nox";

<Drawer
  open={open}
  onClose={() => setOpen(false)}
  side="right"
  width={360}
  height={300}
  align="end"
  inset={8}
  aria-label="Task details"
>
  <Card
    fill
    bodyPadding="var(--ui-space)"
    title="Task details"
    close={() => setOpen(false)}
    closeLabel="Close details"
  >
    <ScrollArea
      style={{ flex: 1, minHeight: 0 }}
      scrollbarLabel="Scroll details"
    >
      {content}
    </ScrollArea>
  </Card>
</Drawer>;
```

## Placement and size

- `side`: `left`, `right` (default), `top` or `bottom`. The card enters and exits
  through that edge.
- `width` and `height`: independent CSS sizes. Numbers mean pixels; strings
  support percentages, `rem`, `min()`, `clamp()` and `auto`. They are constrained
  to the available area. A side drawer defaults to 420px wide and stretches
  vertically; a top/bottom drawer defaults to full width and 320px tall.
- `align`: `start`, `center` (default) or `end` on the cross axis. It matters when
  a custom size leaves unused space along the edge.
- `inset`: gap from the walls. The default is two `--ui-space` units (8px).
  Zero is supported. The gap and rounded corners preserve the attached-card
  appearance rather than replacing the whole view.
- `container`: optional HTMLElement whose visible bounds define the overlay.
  Without one the overlay covers the viewport. Resize and ancestor scroll
  update the bounds. Content is portaled to document.body so ancestor clipping
  and stacking contexts do not trap the native modal. Modal focus still blocks
  the whole page, including areas outside the visual container.

Both dark and light themes use the standard Nox dialog tokens. Card's
appearance is intrinsic; no app CSS, provider or example-specific correction is
required. Portaled text preserves the container's typography, or the opener's
when no container is supplied; explicit typography in `style` takes precedence.
`classNames.frame` / `classNames.backdrop` customize the corresponding
Drawer slots, and `--ui-drawer-backdrop` changes its default 22% black dimming.

## Content and lifecycle

Drawer accepts arbitrary children. Card is optional and works on its own
inside any sized parent. Use `fill` to stretch the card into the drawer frame
and `bodyPadding="var(--ui-space)"` for the compact task-detail body. Compose
Nox ScrollArea for long content while the heading and footer stay visible.
The card does not own modal behavior. See [Card](card.md) for its props.

The host controls `open`. Escape and a pointer click beginning and ending outside
the frame request `onClose`; `dismissible={false}` disables both. Content actions
remain host-owned. Provide `aria-label` or `aria-labelledby` on Drawer and a label
for any close button. Native dialog provides modal semantics; keyboard focus
stays inside. `initialFocus` chooses an element ref; otherwise native dialog
focuses its first control. On exit, focus returns to the opener unless
`restoreFocus={false}`. `onClosed` fires after exit or visible unmount, once per
visible lifecycle. StrictMode effect replay does not report a completed close.

Closing retains the modal until its own frame/backdrop animations finish.
Reopening cancels a pending close; animations inside user content do not delay
closure. Reduced motion removes entry and exit animations. Unmounting cleans up
the native modal, observers and scroll listeners.

See **Components/Drawer** for all directions, independent sizing, contained
placement, long scrolling content, custom surfaces and protected dismissal.
**Components/Card** shows the standalone surface.
