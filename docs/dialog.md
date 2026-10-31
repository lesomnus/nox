# Composable Dialog

`Dialog` provides a controlled native modal boundary. Compose its content with
`DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogBody` and `DialogFooter`.
Header, body and footer are independent parts; no footer or action is required.

```tsx
<Dialog open={open} onClose={() => setOpen(false)}>
  <DialogHeader>
    <DialogTitle>Edit workspace</DialogTitle>
  </DialogHeader>
  <DialogBody>{/* Information, inputs, lists, or any content */}</DialogBody>
  <DialogFooter>
    <Button onClick={save} loading={saving}>
      Save
    </Button>
    <Button onClick={() => setOpen(false)}>Cancel</Button>
  </DialogFooter>
</Dialog>
```

The caller owns open state, actions, submission, pending work and errors. Nox does
not run an action, close on success, translate button labels or choose a cancel
button. `onClose` requests a host state change for Escape or an outside click;
setting `open={false}` itself does not call `onClose`. A click that began inside
the dialog does not count as a backdrop dismissal.

Native modal behavior makes the background inert. Focus stays inside; closing
returns focus to the opener when it still exists. Set `initialFocus` to a ref to
choose the initial element. Without it, the browser selects the initial focus.
Use `dismissible={false}` when the caller wants to block Escape/backdrop dismissal.
An empty dialog or one with no controls can retain focus on its own boundary.

## Closing motion

Setting `open={false}` fades the surface and backdrop out together, with a small
translation and scale that mirror the entrance. The native modal stays in the top
layer until both animations finish: background controls remain inert, and focus
returns to the opener after the exit. Controls inside the closing dialog are
inert too, so repeated clicks cannot run an action again.

Keep Dialog mounted while changing `open`; conditionally removing the component
immediately skips its exit. Use `onClosed` for caller cleanup that would unmount
the dialog or replace its content. It runs after a controlled exit and focus
restoration, not for the initial `open={false}` state or an interrupted exit.
Reopening during exit keeps the modal alive. Only the surface and backdrop are
awaited; animated children cannot delay closing.

`--ui-dialog-exit-duration` defaults to 180ms. Users who prefer reduced motion
skip both entrance and exit animations. The Closing Motion story demonstrates
the difference between requesting a close and finishing it.

`DialogTitle` is an h2 that labels the dialog automatically. `DialogDescription`
is an optional short paragraph registered as its accessible description. Explicit
`aria-label`, `aria-labelledby` and `aria-describedby` are supported. Supply a
title or an explicit accessible label. Do not wrap complex or long body content
in DialogDescription; use DialogBody with ordinary semantic content.

A form can wrap all three parts directly inside Dialog, or live in DialogBody.
Buttons and form handling belong to the host. Footer controls keep Button variant
styling; the dialog does not force them to be transparent. Existing dialog tokens
control padding, body color, radius and action spacing. The header and footer
remain visible when the body scrolls.

## Migrating ConfirmationDialog

Nox no longer exports `ConfirmationDialog`. Its fixed confirm/cancel buttons,
`execute` callback and success/failure policy belong to the consumer. Compose
those using Dialog parts as in the Async Action and Failure And Retry stories;
no specialized confirmation component is needed in the library. cxz's existing
confirmation policy now lives in `ts/src/shared/components/confirmation-dialog.tsx`.

`Card` / `CardActions` provide the same visual surface for inline content,
anchored dialogs and drawers. Dialog shares the Card surface styles while
retaining its freely composed Header/Body/Footer and native modal behavior;
there is no need to nest an extra Card inside Dialog. See [Card](card.md).
`DialogSurface` remains the shared appearance/motion layer.

If existing content already supplies its own Card, use `frame={false}` to render
it directly inside the shared animated surface without a second frame. `anchored`
sets the surface's transform origin to its upper-left corner. `decoration` renders
noninteractive content outside that surface, for example a `DialogTrigger` copy
that should stay at its original viewport position. These options keep the same
native modal boundary, focus handling, backdrop and close lifecycle. The Custom
Card story demonstrates this composition.

Storybook includes information, custom footer actions, forms, caller-owned async
actions with retry, long content and a dialog without a footer.
