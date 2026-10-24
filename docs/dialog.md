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

`DialogCard` / `DialogActions` remain available for existing visual card consumers;
`DialogSurface` remains the shared appearance/motion layer. They are not required
when using the new Dialog, which includes its own card and surface.

Storybook includes information, custom footer actions, forms, caller-owned async
actions with retry, long content and a dialog without a footer.
