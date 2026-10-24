# Navigation and record details

These components bring the compact resource views refined in cxz into Nox.
They accept ordinary React values and callbacks. They do not import a router,
API schema, clipboard permission prompt, application translations, or storage.

## Native selection and copy controls

`Checkbox` keeps a native checkbox input for form submission, labels, keyboard
activation and disabled behavior. It supports controlled and uncontrolled values,
an input `ref`, and `indeterminate`. Supply an accessible name with a surrounding
label, an external label and input ID, or `aria-label`. Its CSS is scoped; it does
not change host checkbox styles. Override `--ui-checkbox-size` to adjust its size.

`CopyButton` copies `value` on activation using the browser clipboard API.
It reports success or failure in its hover/focus hint and a live status region,
and prevents duplicate activation while the write is pending. `onCopied` and
`onCopyError` let the caller also provide application feedback. Clipboard writes
require a secure browser context and may be denied; the component does not request
permission on mount. Built-in labels use `UIProvider` translations.

`IdentifierValue` displays a fixed-width prefix with an in-place full-value hint
and a compact copy control. Copy always uses the complete original value.
`prefixLength` changes the reserved text width, `copyable` hides the copy control,
and `copyLabel` customizes its accessible label. Empty values use `empty`.
The overlay uses `OverflowHint`, so expanded identifiers can escape clipped
containers while keeping the original text origin and baseline.

## Dates and information fields

`DateTime` accepts a `Date`, epoch milliseconds, or a date string. It displays the
viewer's local calendar time and numeric UTC offset for that instant, including
daylight-saving changes. Separators are muted. A native `time` element retains
the UTC instant in `datetime`; absent or invalid values use `empty`.
API timestamp objects belong in the consuming application's adapter.

`FieldLabel` adds an optional help icon to a label. Its description uses a
portaled `OverflowHint`, available on hover or keyboard focus and dismissed with
Escape. Help labels can be translated through `UIProvider`.

`DescriptionList` renders rows as a semantic `dl` with consistent label and value
typography. Each row has `label`, `value`, optional `description` and optional
stable `id`. Values can contain controls, dates, identifiers or arbitrary React
content. Missing values use `empty`; numeric zero remains visible. Choose one
or two `columns` to fit the containing view.

`EditableValue` aligns its text with a plain value without adding layout space
for its padded hit area. Its own styles extend that padding around the text,
so editable and read-only fields share the same text origin and row height.
The input opens over the padded control with the same text position; callers
do not need offsets or example-specific styles.
When used in a description list, the field's `dt` label also remains above the
editing backdrop at its original position and typography. The label returns
to normal when editing closes; no additional wiring is required.

```tsx
import { DateTime, DescriptionList, IdentifierValue } from "@lesomnus/nox";

<DescriptionList
  rows={[
    { label: "ID", value: <IdentifierValue value={record.id} /> },
    { label: "Name", value: record.name },
    { label: "Created", value: <DateTime value={record.createdAt} /> },
    {
      label: "State",
      value: record.state,
      description: "Current availability.",
    },
  ]}
/>;
```

## Persistent navigation

`NavigationPanel` composes a fixed header, optional right-aligned `actions` and
an inset `ScrollArea`. The header remains outside the scroll viewport. Hovering
the header does not reveal the body handle. The panel shares body/radius tokens
with `DialogCard`, and header actions share its footer spacing token. The body
uses the tighter control inset, keeping external whitespace compact.

Give the panel a bounded height, directly or through its parent layout.
`scrollAreaProps` exposes viewport refs, scroll callbacks, slot class names and
the scrollbar's accessible label. The caller supplies item data, selection,
routing and fetching; `PanelItem` and `PanelItemAnchor` can render the items.
Application-specific unread tracking stays outside this component.

See **Integration/RecordBrowser** for the components used together without an
application stylesheet or service. Individual stories include empty, disabled,
mixed, editable and light-theme cases. Source CSS tokens remain the source of
truth for dimensions and spacing.
