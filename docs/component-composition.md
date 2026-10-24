# Composable components

The default components remain convenience compositions. Import the parts from
`@lesomnus/nox` to arrange, omit or wrap meaningful regions. Native props,
styles, events and refs are retained unless a value is owned by the shared
state. All components support the normal compiled and `nox-source` entries.

## Slider

`Slider` is a bare native range inside its state root; it does not add ticks or
a visible value. Compose `SliderRoot`, `SliderControl`, `SliderValue`,
`SliderTicks` and individual `SliderTick` elements for a custom layout.

```tsx
<SliderRoot
  label="Gain"
  min={-10}
  max={10}
  step={0.5}
  defaultValue={2.5}
  name="gain"
  style={{ display: "grid", width: 280, gap: 8 }}
>
  <SliderValue />
  <SliderControl />
  <SliderTicks values={[-10, 0, 10]} />
</SliderRoot>
```

Root owns the numeric value, bounds, step and shared disabled/readOnly state.
Defaults are min=0, max=100, step=1, value=min. Controlled `onChange` receives a
number. `name`/`form` are applied to the native control; uncontrolled form reset
restores defaultValue without a callback. Root is a layout-neutral fieldset.
Use one Control per Root. Override individual control descriptions/labels when
needed; `SliderValue` associates with the generated control ID. When supplying a
custom Control id, also supply the matching Value htmlFor.

Control defaults horizontal; `orientation="vertical"` increases bottom to top.
Native range keyboard and touch behavior are retained. Value children override
the default numeric display. Ticks are decorative; supply numbers or
`{value,label,title}` entries, or compose Tick children. Their positions use
actual numeric distances, not evenly spaced array indices. For vertical ticks,
set `orientation="vertical"` and size the ticks to the rail's usable height
(the default 160px rail uses 148px ticks plus 6px end margins).

SettingSlider now composes these parts. Its inherited position zero, 1–8 ticks
and display of existing out-of-range setting values remain preset policy.
The generic Slider does not give zero any special meaning.

## DescriptionList

```tsx
<DescriptionListRoot columns={1}>
  <DescriptionListRow>
    <DescriptionListTerm>Maintainers</DescriptionListTerm>
    <DescriptionListDetails>Alice</DescriptionListDetails>
    <DescriptionListDetails>Bob</DescriptionListDetails>
  </DescriptionListRow>
</DescriptionListRoot>
```

Root/Row/Term/Details render dl/div/dt/dd. Use arbitrary labels or FieldLabel,
multiple terms/details and conditional rows. Term and Details remain adjacent
inside a row, preserving native semantics and EditableValue's label anchoring.
Each part has native props/ref; no shared state is required. Root retains the
columns=1|2 layout. Existing `DescriptionList rows={...}` composes these parts
and keeps its empty-value behavior. The existing **type** DescriptionListRow
still describes row data; the new value export with that name is the component,
whose native props are DescriptionListRowProps.

## NavigationPanel

```tsx
<NavigationPanelRoot style={{ width: 240, height: 440 }}>
  <NavigationPanelHeader>
    <NavigationPanelTitle>Documents</NavigationPanelTitle>
    <NavigationPanelActions>{addButton}</NavigationPanelActions>
  </NavigationPanelHeader>
  <NavigationPanelScrollBody scrollbarLabel="Scroll documents">
    {items}
  </NavigationPanelScrollBody>
  <NavigationPanelFooter>{status}</NavigationPanelFooter>
</NavigationPanelRoot>
```

Title registers its ID with Root to label the aside automatically, including
through wrappers and after remounting. Explicit aria-label/aria-labelledby take
precedence. Supply an accessible name when omitting Title. Header, Actions and
Footer accept arbitrary children; include search/filter controls as needed.
ScrollBody composes ScrollArea with the existing inset surface. Body is a plain
non-scrolling div with the same inset treatment. Header/Footer stay outside the
scroll viewport. Bound the Root height when using ScrollBody.

The original NavigationPanel still takes title/actions/children/scrollAreaProps
and composes Header/Title/Actions/ScrollBody. No default footer was added.

## Calendar

Calendar is the date-selection surface without DatePicker's trigger or popup.
It supports the same single/multiple/range value union, bounds, disabled-date
rules, date metadata, localization and custom selection resolvers.

```tsx
<Calendar
  label="Schedule"
  mode="range"
  defaultValue={{ start: "2026-10-21", end: null }}
  name="period"
/>
```

For custom composition:

```tsx
<CalendarRoot
  label="Custom schedule"
  mode="range"
  value={period}
  onChange={setPeriod}
  style={{ display: "grid", width: 300, gap: 12 }}
>
  <CalendarHeader>
    <CalendarPreviousMonth />
    <CalendarMonth />
    <CalendarNextMonth />
  </CalendarHeader>
  <CalendarGrid />
  <CalendarDetails />
  <CalendarStatus />
  <CalendarFooter>
    <CalendarClear />
    <CalendarToday />
  </CalendarFooter>
</CalendarRoot>
```

Root owns state, focus, previews, availability and hidden form fields. It has
no prescribed layout. Use one Grid per Root. Header/Month/PreviousMonth/NextMonth, Grid, Details,
Status, Footer/Today/Clear/Done use the nearest Root. Arrange them through any
wrappers; omit the header/footer or add application content. Grid retains the
complete accessible month structure and roving keyboard focus; date markers
and styles remain customizable through getDateInfo. Grid names itself with the
visible month, including when Header/Month are absent.

Header and Footer supply their default children when none are given. Details
renders focused/hovered date metadata when getDateInfo exists; Status renders
multiple/range selection guidance. The default Footer adds Done only when
onDone is provided. `onSelect(selection)` reports each accepted day action,
including selecting the same day again; onChange remains change-only and
mode-specific. `onClear` and `onDone` let a host close its own popover. These
callbacks do not automatically dismiss an inline Calendar.

Initial month follows the selection or today, bounded by min/max; defaultMonth
can override it using a valid YYYY-MM-DD date. Calendar does not grab focus on
mount unless autoFocus=true. User navigation/selection moves focus within the
grid. External controlled value changes follow the new selected month while
focus is outside the calendar; focused users keep their current navigation.
Escape/Tab and outside clicks belong to the surrounding host, not inline state.

`name`/`form` serialize single dates, repeated multiple dates, or range
`name.start`/`name.end` fields; uncontrolled reset restores defaults. Root
readOnly prevents selections but permits browsing; disabled also disables
navigation/day controls. CalendarDateInfo is the metadata type;
DatePickerDateInfo remains a compatible alias. DatePicker now composes Calendar
and retains its popup positioning, scroll boundary, focus return and dismissal
policy. See [date selection modes and metadata](date-picker.md).

Storybook includes Slider Composed/Form/Vertical, DescriptionList Composed,
NavigationPanel Composed/WithoutScroll and Calendar inline/custom/grid-only/form
examples, alongside all existing presets.
