# Recoverable event handler failures

Use `useAsyncAction` when an event starts work that can throw or reject. Compose
`ActionError` anchored to the affected control. Both are optional: native events and
controlled values keep their existing contracts. Shared recipes live in
Patterns/HandlerFailures, organized by recovery behavior rather than repeated
on every component page. Each recipe fails its first request and succeeds on
retry, without a real network service. Use Storybook Controls to switch between
equivalent controls or surfaces within a recipe. Component pages document their
own APIs; ActionError also demonstrates its appearance, retry and localization.

```tsx
const trigger = useRef<HTMLButtonElement>(null);
const publish = useAsyncAction(async () => {
  await api.publishReport();
});

return (
  <>
    <Button
      ref={trigger}
      loading={publish.pending}
      onClick={() => void publish.run()}
    >
      Publish report
    </Button>
    {publish.error && (
      <ActionError
        title="Publish failed"
        anchor={trigger.current}
        pending={publish.pending}
        onDismiss={publish.reset}
      >
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

`ActionError` provides an alert with a compact bold `title`, a dismiss button,
optional retry and pending feedback. Its default title is "Action failed".
Pass `onDismiss={action.reset}` to clear the caller's failure feedback without
canceling a request or losing an edited draft. Without `onDismiss`, the mounted
error can still be dismissed locally; unmount it between separate failures.
Dismissal returns focus to the anchor. Pass
`anchor` to overlay it beside the triggering control without changing layout;
`placement` defaults to `top-start`, above the trigger, and flips or shifts at
viewport edges. Retry is hidden by default, even when an `onRetry` handler is
provided. Set `showRetry` together with `onRetry` to display it. Storybook's
shared recipes expose this opt-in through the `showRetry` control. The shared
menu surface keeps it clear of clipping and inside an anchor's open Dialog,
where its Retry button remains interactive. Scroll and resize reposition it.
The surface uses a subtle red border and a tinted translucent background with
backdrop blur in both themes. Text uses the normal foreground color. It stays
mounted during retry and clears on success or reset; there is
no timed dismissal. Omitting `anchor` retains inline composition; `anchor={null}`
waits for a trigger instead of temporarily inserting a layout box.
Render it only on failure, inside a modal body or outside a menu that closes.
Supply a safe application message; diagnostic objects need not reach the UI.
Default messages and Retry use UIProvider; `retryLabel` overrides the latter.
Anchored feedback connects its `id` to the trigger's `aria-describedby` and
preserves existing descriptions. Inline feedback can be connected manually. When success
removes focused feedback, restore a persistent control's focus or let the closing
Dialog/Drawer restore its opener.

### Trigger appearance

While an anchored error is visible, its control receives
`data-action-error-open="true"` and an inset red stroke that keeps its dimensions
unchanged. The stroke uses `--ui-action-error-trigger-border` and
`--ui-action-error-trigger-border-width`; override them on a control or an ancestor.
Set `highlightTrigger={false}` to opt out of this stroke. The open-state attribute
remains available for any component-specific treatment, without a fixed list of
appearance presets:

```css
.saveButton {
  --ui-action-error-trigger-border: var(--ui-shade-237);
}

.saveButton[data-action-error-open="true"] {
  background: var(--ui-button-hover-background);
}
```

The state attributes and added accessible description are removed when the error
is dismissed, unmounted, or moved to another anchor. Existing descriptions and
other errors on the same anchor are preserved. Changing these styles does not
move surrounding content. Components/ActionError/TriggerStyling demonstrates the
default stroke, overridden tokens and a background-only treatment.

### Waiting for menu actions

`ActionMenu` and `ValueMenu` (including its prefix wrappers) support
`awaitAction`. It defaults to false, retaining immediate closing. Enable it to
keep the menu visible until `run` or `choose` succeeds. Return the actual handler
Promise and let failure reject or throw; starting work with `void` or swallowing
its rejection makes the menu consider it successful.

```tsx
<ActionMenu
  label="Report actions"
  awaitAction
  items={[{ label: "Publish", run: () => api.publishReport() }]}
/>
```

The active item shows pending feedback and duplicate actions are blocked. Failure
keeps the menu open and shows the shared ActionError anchored to that item,
including its trigger styling. Dismiss the error or activate the item again to
retry. Success closes the menu and restores its opener. This mode owns its error
feedback; avoid wrapping its handler with another error surface. The caller still
owns the committed value of a ValueMenu.

Escape and outside clicks remain manual dismissal. They do not cancel work, and
a late result cannot close a newly reopened menu or show stale feedback there.
Menus/Features/AwaitAction compares both menus using the existing failure recipes;
Patterns/HandlerFailures/MenuAction and MenuChoice expose the option in Controls.

| Family                                                  | Example recovery policy                                                                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Button, BorderTrailButton, ConfirmButton, FileChip      | Busy guard, local error and explicit retry. Confirmation still applies to fresh activations.                                                 |
| ActionMenu                                              | Default closes before `run`; `awaitAction` keeps it open and anchors failure to its item.                                                    |
| LinkButton, ButtonAnchor                                | Plain clicks load a preview; modified clicks retain native behavior.                                                                         |
| CopyButton                                              | Failing `onCopied` work is separate from clipboard success. Retry repeats only the failed follow-up. Clipboard denial has separate feedback. |
| Switch, ToggleButton, Checkbox, Radio, SegmentedControl | Keep the confirmed value on failure; retry the requested value.                                                                              |
| ValueMenu, PrefixValueMenu, IconValueMenu               | Default feedback stays outside the closed menu; `awaitAction` awaits `choose` and keeps failure beside its option.                           |
| EditableValue                                           | `save` already catches rejection and keeps its editor/draft. Pass the rejecting promise directly, without swallowing it with `run`.          |
| Form                                                    | Capture FormData synchronously, preserve the draft and native required validation on retry.                                                  |
| PinInput                                                | Failed `onComplete` verification retains the entered code for correction or retry.                                                           |
| DatePicker, Calendar, SuggestionGrid                    | Commit a discrete choice after success. DatePicker's `awaitAction` keeps failures on the chosen day inside the open calendar.                |
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
