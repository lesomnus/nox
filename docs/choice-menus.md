# Checkbox and radio menus

`CheckboxMenu` selects several values; `RadioMenu` selects one value. Both use
the same anchored surface, scroll area, keyboard navigation and row layout.
Their draft stays local while open. Dismissing through the trigger, Escape,
outside click or focus departure calls `choose` once if the value changed.
Escape applies the draft; it does not discard it.

```tsx
const options = [
  { value: "info", label: "Information" },
  { value: "warning", label: "Warnings" },
  { value: "error", label: "Errors", disabled: true },
];
const [levels, setLevels] = useState(["info"]);
const [sort, setSort] = useState("newest");

<CheckboxMenu
  label="Log level"
  allLabel="All levels"
  options={options}
  value={levels}
  choose={setLevels}
/>
<RadioMenu
  label="Sort order"
  options={[
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
  ]}
  value={sort}
  choose={setSort}
/>
```

The checkbox All row derives its mixed state from enabled options. It toggles
only enabled options and preserves disabled or unavailable selections. Radio
menus focus the selected enabled option on opening. Arrow keys, Home and End
move focus and skip disabled entries; Space and Enter change the draft without
closing. Reopening starts from the current controlled value.

Both accept `triggerContent`, `disabled`, `triggerClassName` and `menuClassName`.
An option can supply `icon` and `disabled`. The trigger's accessible name always
uses `label`, even when its visible content is customized. Supply translated
labels from the consuming application. `--ui-choice-menu-width` can customize
menu width; shared menu, checkbox/radio and spacing tokens supply the remaining
geometry.

Press feedback affects only each option's icon and text. Its state indicator
stays fixed, and icons have a centered slot even when wrapped in a popover.
The decorative `CheckboxIndicator` and `RadioIndicator` reuse the native
controls' visual styles without adding nested form inputs. Use `Checkbox` and
`Radio` for actual form fields.

Use `ValueMenu` when the trigger should display a selected value and the menu
should align that value with the trigger. Use these choice menus for a stable
trigger label and a draft applied on dismissal. For custom menu composition,
`AnchoredMenu` exposes the shared placement, entrance, focus, scrolling-anchor
tracking and dismissal behavior.

Storybook's **Components/CheckboxMenu** and **Components/RadioMenu** have matching
default, icon, disabled-option, long-list and disabled-trigger examples. Their
outputs show the committed value and callback count separately from the draft.
