# Menu overlays

`ActionMenu` and `ValueMenu` share `MenuSurface` for their portal, themed
foreground, translucent background, backdrop blur, padding and frame.
The surface copies its trigger's typography rather than inheriting the host
document's font. It owns its foreground color, so a host page's text color
cannot make dark menus unreadable. Shade and dropdown tokens are the source
of truth for appearance.

Their interaction remains separate: ActionMenu executes commands in an adjacent
popup; ValueMenu changes a value and aligns its selected row with the trigger's
text. Each component owns its placement, focus, keyboard navigation and roles.

`MenuSurface` is also exported for custom menus. Supply an `anchor` element,
position the surface with its div props/ref, and implement the appropriate
accessibility and dismissal behavior. It portals into the anchor's nearest open
native dialog, or the document body otherwise, so menus remain in the dialog's
top layer. Inline typography styles can override the copied trigger styles.

Storybook **ActionMenu → Shared Surface** compares both menus using the same
surface and trigger font in dark and light themes.
