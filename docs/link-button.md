# LinkButton

`LinkButton` renders a native anchor with a compact outline, an ellipsized label
and a trailing arrow, as used in Table's Selectable account column.

```tsx
import { LinkButton } from "@lesomnus/nox";

<LinkButton href="/accounts/personal">Personal account</LinkButton>;
```

Native anchor attributes, click handlers, refs, `className` and `style` pass
through. Browser navigation, modifier clicks, keyboard activation and opening
in another tab keep native link behavior. It has no dependency on a router.
Use `trailing={null}` to omit the arrow or provide another decorative node.
The trailing element is hidden from assistive technology; include essential
information in the label. Set a width for truncation or `width: 100%` to fill
a table cell.

Theme tokens: `--ui-link-button-height` (32px), `--ui-link-button-border`,
`--ui-link-button-hover-border`, `--ui-link-button-color` and
`--ui-link-button-hover-background`. Table's example overrides the height
token to match its row size.

See Storybook **Components/LinkButton** for default, no-arrow, truncated and
new-tab examples.
