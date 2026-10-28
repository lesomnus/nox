# FileChip

An inline file reference with inherited typography, a file icon, a muted outline and a divider before the label. It has a transparent background and uses the shared theme palette. It does not read files, upload data or open a viewer.

Use `as="a"` with a native `href` for navigation, `as="button"` for an action, or the default span for a reference. Native attributes, handlers and refs pass through. Supply an accessible name when the label is decorative. Disabled buttons keep native keyboard behavior. `loading` sets `aria-busy` and runs a fading shimmer; reduced motion keeps a static treatment.

```tsx
<FileChip as="a" href="/files/report.md">report.md</FileChip>
<FileChip as="button" onClick={openFile}>report.md</FileChip>
```

For sanitized HTML already owned by a Markdown renderer, apply the exported `fileChipClassName` to its existing anchor. This uses the same stylesheet without a second React root or replacing the renderer's markup. The caller retains sanitization, navigation and metadata popovers.

## Native text overlays

`textLayout` reserves decoration space with literal spacing characters instead of CSS padding or a border that would advance the text. Pair it with `fileChipText(label)` in the native text control. The helper and painted component use identical spacing; keep these characters inside the chip's atomic selection range and keep them out of persisted content and copied file data. The inset outline leaves the native caret unobscured. This mode inherits wrapping and typography from the editor.

```tsx
const value = fileChipText(label);
// The editor maps the decorated display range to its underlying attachment.
<FileChip textLayout role="button" tabIndex={0} aria-label={label}>
  {label}
</FileChip>;
```

Visual defaults live in `theme/tokens.css` and the component stylesheet. Application-specific progress, byte formatting, errors and attachment dialogs belong to the caller.

`pixelLayout` uses the rendered content for layout and rounds text boxes to whole CSS pixels. Custom leading controls participate in normal flow; no typographic padding string determines their container width. This is separate from `textLayout`, which preserves a caller's native text advances. An editor using `pixelLayout` must reserve the measured chip advance plus `--ui-file-chip-caret-gap` in its native text layer rather than reuse `fileChipText` as a size estimate.

`leading` replaces the icon with caller content. Use the default span host for interactive children such as `SegmentedControl size="inline"`; do not nest controls inside a link or button. Set `textPrefix` to the spacing reserved for the leading area and pass that same prefix to `fileChipText(label, textPrefix)` in a native overlay. The control is positioned inside the reserved area, separately from its accessibility-hidden spacing, so changing a selection does not alter the text's advances.
