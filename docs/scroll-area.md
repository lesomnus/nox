# ScrollArea

A bounded scroll viewport with native wheel/touch scrolling, a centered growing
rail, capped handles, hover/focus/drag visibility and background-colored edge
fades. It needs no application styles, router or provider. Supply a bounded
height, or put it in a flex parent whose height is constrained.

```tsx
import { ScrollArea } from "@lesomnus/nox";
import "@lesomnus/nox/styles.css";

<ScrollArea className="document-scroll" scrollbarLabel="Scroll document">
  <Article />
</ScrollArea>;
```

## Scrollbar offset

`scrollbarOffset` is an optional signed pixel distance from the container edge to
its visual handle's center. Positive values move the vertical handle right and
the horizontal handle down, outside the container. Negative values move them
inside. Zero centers each handle on its corresponding edge. Fractional values
are supported. Omitting the prop retains the existing internal placement and
content clearance.

```tsx
<ScrollArea
  className="document-scroll"
  scrollbarOffset={offset}
  horizontalScrollbar
  scrollbarLabel="Scroll document"
  horizontalScrollbarLabel="Scroll columns"
>
  <WideDocument />
</ScrollArea>
```

Clearance follows the handle's overlap with the content: inset handles reserve
reading space, while handles moved fully outside leave the full viewport width
and height available. `--ui-scroll-area-content-inset` can override the vertical
clearance. The native viewport still clips its content and inherits the root
radius; edge fades keep their rounded corners. Hover, proximity, drag, focus and
keyboard behavior are unchanged.

Offsets do not allocate space outside the component. Leave room beside and below
the area when using positive values, for example with padding on its parent. A
clipping ancestor can still hide the handles; this component does not portal
through ancestor overflow or change neighboring layouts. Neither axis shows a
handle unless its content overflows.

## Composition and control

`viewportRef` exposes the native scroll element. `onScroll` receives that
viewport's scroll events. `className`, `viewportClassName`, `contentClassName`
and `classNames` customize slots without replacing scrolling behavior.
`horizontalScrollbar` adds horizontal pointer/keyboard navigation; name it with
`horizontalScrollbarLabel`. Vertical handles support arrows, Page Up/Down and
Home/End. Horizontal handles use left/right arrows and the same page/end keys.

Hovering a rail keeps its scrollbar visible, including inset and outside offsets.
A primary pointer press on the empty rail centers the handle at that position,
clamped to the scroll range. Keep holding to drag from there. Pressing the handle
itself retains its grab position. Both axes focus their scrollbar for subsequent
keyboard navigation; an area without overflow has no interactive rail.
Wheel and trackpad events over either rail scroll the native viewport too.

Override `--ui-scroll-area-background` to match the containing surface and fades.
Backdrop blur applies only inside the thin translucent rail line through
`--ui-scroll-area-rail-blur`. The wider pointer target stays invisible;
there is no surrounding blur surface. The foreground handle stays sharp.
Geometry, color, motion, gap and fade defaults live in `src/theme/tokens.css`.
Reduced motion disables visual transitions. Content fetching, virtualization
and ancestor clipping policy belong to the caller.

Storybook **Layout/ScrollArea** covers long/short/no overflow, growing content,
horizontal scrolling, outside handles, zero/negative offsets and no overflow.
