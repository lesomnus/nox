# Table

Native table parts styled after cxz's project session list: a compact muted
header, 44px rows, fine separators and separate hover/selected backgrounds.
Import the parts from `@lesomnus/nox`.

```tsx
<Table aria-label="Sessions">
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>State</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow selected={selected}>
      <TableCell>Workspace</TableCell>
      <TableCell>Working</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`,
`TableCell` and `TableCaption` render their corresponding HTML elements and
accept native attributes, events, `className`, `style` and refs. `TableHead`
defaults to `scope="col"`; use `scope="row"` for row headings. Column widths,
`colgroup`, `colSpan`, `rowSpan`, alignment (`align="right"` or `"center"`)
and contents remain caller-controlled. Table layout defaults to native `auto`;
set `style={{ tableLayout: "fixed" }}` when columns should have fixed widths.

`TableRow.selected` sets the selected appearance and `aria-selected`. Selection
state, checkboxes, links, editing, sorting, pagination and row actions belong
to the caller. Rows do not become clickable or focusable automatically.
Use a real checkbox or button for keyboard-accessible interactions.

`Table` defaults to `stickyHeader`. The entire `TableHeader` sticks within the
nearest scrolling ancestor, including multi-row headers. Use
`stickyHeader={false}` to disable it. The base table and header are transparent;
the sticky header uses backdrop blur while rows pass underneath it. Override
`--ui-table-background` if an opaque surface is needed.

For bounded scrolling, wrap the table in `TableScrollArea`. It accepts all
`ScrollArea` props, including `viewportRef`, `scrollbarLabel` and slot classes.
Set its `aria-label` and `role="region"` when it is a separately named region.
Its default height is 360px; override with `className`, `style.height` or
`--ui-table-viewport-height`. Give the table a `minWidth` if narrow viewports
should scroll horizontally. Horizontal overflow shows a visible scrollbar with
pointer dragging, Left/Right, PageUp/PageDown and Home/End navigation. Its space
is reserved below the viewport so it does not cover the last row. Set
`horizontalScrollbar={false}` to hide it, or `horizontalScrollbarLabel` to
customize its accessible name. The table can also be used without any wrapper.

Optional `TableCaption` names/describes the table; `TableFooter` displays totals
or summaries. Empty/loading states can use a `TableCell` with `colSpan` and
caller-provided content; pass `aria-busy` to `Table` while loading. The Loading
story uses reusable `Skeleton` placeholders per cell, with one loading status
for the whole table. Selectable account links use `LinkButton`.

Theme tokens (override on a table or its scroll area):

| Token                                  | Default              |
| -------------------------------------- | -------------------- |
| `--ui-table-background`                | `transparent`        |
| `--ui-table-header-color`              | `--ui-muted`         |
| `--ui-table-row-border`                | `--ui-shade-36`      |
| `--ui-table-hover-background`          | `--ui-shade-32`      |
| `--ui-table-selected-background`       | `--ui-selected`      |
| `--ui-table-selected-hover-background` | `--ui-shade-51`      |
| `--ui-table-font-size`                 | `11px`               |
| `--ui-table-header-height`             | `28px`               |
| `--ui-table-row-height`                | `44px`               |
| `--ui-table-row-gap`                   | `--ui-control-inset` |
| `--ui-table-cell-padding`              | `--ui-space`         |

Storybook **Components/Table** includes plain, selectable, editable, scrolling,
empty and loading examples. The cxz page retains its existing implementation.
