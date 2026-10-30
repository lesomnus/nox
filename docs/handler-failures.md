# Recoverable event handler failures

Use `useAsyncAction` when an event starts work that can throw or reject. Compose
`ActionError` next to the affected control. Both are optional: native events and
controlled values keep their existing contracts. Every FailureAndRetry example
fails its first request and succeeds on retry, without a real network service.
The Patterns/HandlerFailures gallery compares recovery policies.

```tsx
const publish = useAsyncAction(async () => {
  await api.publishReport();
});

return (
  <>
    <Button loading={publish.pending} onClick={() => void publish.run()}>
      Publish report
    </Button>
    {publish.error && (
      <ActionError pending={publish.pending} onRetry={() => void publish.run()}>
        Could not publish. Your report is still available.
      </ActionError>
    )}
  </>
);
```

`run(...args)` catches synchronous exceptions, rejected promises and thenables.
Its `Promise<boolean>` is true on success and false on failure, duplicate
activation or completion after unmount. A ref blocks duplicates before React
renders pending state. Each call uses the latest callback and infers its argument
types. Capture input values or FormData before yielding; do not retain a live
event's `currentTarget`.

`pending` settles on success or failure. `error` is an Error; non-Error thrown
values are wrapped with the original `cause`. Feedback stays mounted during
retry, including its focused button. Success or `reset()` clears it. Reset clears
feedback only, without canceling work. The caller owns cancellation and side
effects inside its callback; the hook suppresses only its own state updates and
success result after unmount. No automatic retry, rollback or logging occurs.

`ActionError` provides an inline alert, optional retry and pending feedback.
Render it only on failure, inside a modal body or outside a menu that closes.
Supply a safe application message; diagnostic objects need not reach the UI.
Default messages and Retry use UIProvider; `retryLabel` overrides the latter.
Connect its native `id` with `aria-describedby` where available. When success
removes focused feedback, restore a persistent control's focus or let the closing
Dialog/Drawer restore its opener.

| Family                                                  | Example recovery policy                                                                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Button, BorderTrailButton, ConfirmButton, FileChip      | Busy guard, local error and explicit retry. Confirmation still applies to fresh activations.                                                 |
| ActionMenu                                              | `run` closes the menu normally; feedback survives beside its opener.                                                                         |
| LinkButton, ButtonAnchor                                | Plain clicks load a preview; modified clicks retain native behavior.                                                                         |
| CopyButton                                              | Failing `onCopied` work is separate from clipboard success. Retry repeats only the failed follow-up. Clipboard denial has separate feedback. |
| Switch, ToggleButton, Checkbox, Radio, SegmentedControl | Keep the confirmed value on failure; retry the requested value.                                                                              |
| ValueMenu, PrefixValueMenu, IconValueMenu               | `choose` commits after success; failure is outside the closed menu.                                                                          |
| EditableValue                                           | `save` already catches rejection and keeps its editor/draft. Pass the rejecting promise directly, without swallowing it with `run`.          |
| Form                                                    | Capture FormData synchronously, preserve the draft and native required validation on retry.                                                  |
| PinInput                                                | Failed `onComplete` verification retains the entered code for correction or retry.                                                           |
| DatePicker, Calendar, SuggestionGrid                    | Commit a discrete choice after success.                                                                                                      |
| ColorPicker, Slider, SettingSlider                      | `onChange` edits a local draft; a composed Save persists it. No request per pointer frame.                                                   |
| Dialog, Drawer, Card                                    | Caller-owned save-before-close: failure keeps the surface open; Discard closes without saving.                                               |
| Popover                                                 | `onOpenChange` starts lazy loading. Failure keeps the trigger usable and retry stays outside the tooltip.                                    |
| Table                                                   | Failed row deletion keeps the row.                                                                                                           |
| ResizeHandle, SplitLayout                               | Resize locally and save the complete layout; failure keeps the current layout.                                                               |

PanelItem/PanelItemAnchor and primitive parts forwarding native events reuse the
Button/ButtonAnchor adapter. Render functions, date predicates, geometry callbacks
and per-frame animation readers are synchronous calculations, not async action
slots. The hook does not catch rendering errors, handlers that have not opted in,
or detached work the callback did not return/await.
