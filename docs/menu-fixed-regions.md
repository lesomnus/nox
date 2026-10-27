# Fixed menu regions

`ActionMenu` and `ValueMenu` accept arbitrary `header` and `footer` nodes. These
regions stay above and below the scrolling choices even when a value menu opens
upwards. Only the body scrolls; the available list height reserves room for both
regions and the popup frame.

```tsx
<ActionMenu
  label="More"
  items={actions}
  header={<div>Editor actions</div>}
  footer={
    <div role="toolbar" aria-label="Editor options">
      {toggles}
    </div>
  }
/>
```

Footer controls own their state and handlers. Clicking one does not select an
item or close the popup. Native inputs and buttons retain their own arrow keys;
Escape closes the popup and returns focus to its trigger. Tab follows the visible
controls. Menu/listbox semantics belong to the choices, outside the custom fixed
regions. An ordinary action or value selection still closes the popup.

For custom menus, `MenuSurface`, `MenuFrame`, and `MenuScrollArea` can be composed:

```tsx
<MenuSurface anchor={trigger}>
  <MenuFrame header={header} footer={footer}>
    <MenuScrollArea>{items}</MenuScrollArea>
  </MenuFrame>
</MenuSurface>
```

Custom compositions own positioning, focus, roles and height constraints. The
ready-made menus provide those behaviors. No `fixed` or `sticky` positioning is
needed for the header/footer; keep the scrolling area inside the frame body.

`ActionMenu` forwards `scrollbarOffset` to its scrolling list. Positive values
place the handle outside, negative values inside and zero on the edge, using
ScrollArea's signed pixel convention. The popup reserves viewport room for an
outward handle and releases its reveal mask after the entrance completes so the
handle stays visible and interactive. Header/footer positions stay fixed.
See **ActionMenu → Outside Scrollbar** and [ScrollArea](scroll-area.md).

With an explicit scrollbar offset, menu glass is painted in a sibling background
layer. The glass and content enter independently, keeping parent backdrop filters
and retained root fades out of the rail's backdrop ancestry. Completed body
reveal effects are released. This lets the outward rail blur ordinary page text
while the menu itself keeps its translucent glass appearance.
