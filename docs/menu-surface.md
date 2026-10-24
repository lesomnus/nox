# Menu overlays

Use Storybook's top-level **Menus** gallery to explore menu overlays together.
Its Docs page uses this guide directly. **Menus/Features** collects the detailed
feature cases, showing ActionMenu and ValueMenu side by side from the same data.
The component pages keep their basic API controls and specific behavior:

- **Components/ActionMenu**: basic commands and an action-driven language trigger.
- **Components/ValueMenu**: the basic selector, item dividers, empty search results
  and selected-only/empty groups.
- **Components/IconValueMenu**: the icon wrapper's basic API.

Shared feature examples belong under Menus rather than being repeated on one
component page. Value-only controls in a comparison affect only ValueMenu; the
capability table below identifies those differences.

`ActionMenu` runs commands or toggles checked choices in a popup beside its
trigger. `ValueMenu` selects a value, aligning its current row with the trigger's
text. `IconValueMenu` wraps ValueMenu with an adjacent decorative icon and a
shared hover background.

## Shared surface and supported features

All three use `MenuSurface` for the portal, themed foreground, translucent
background, backdrop blur, padding and frame. The surface copies the trigger's
typography instead of inheriting the host document's font. It owns its foreground
color, so a host page cannot make dark menus unreadable. Shade and dropdown
tokens are the source of truth for appearance.

Sharing the surface does not make the interaction APIs interchangeable. Each
menu owns its placement, focus, keyboard navigation, dismissal and roles.
IconValueMenu supports the same choices and search behavior as ValueMenu.

| Capability                                         | ActionMenu                                    | ValueMenu                                         |
| -------------------------------------------------- | --------------------------------------------- | ------------------------------------------------- |
| Titled/untitled groups and dividers between groups | `groups`                                      | `groups`                                          |
| Item icons                                         | `items[].icon`                                | `options[].icon` or `groups[].items[].icon`       |
| Group-title icons                                  | —                                             | `groups[].icon`                                   |
| Current state                                      | `items[].checked`                             | `value` and `choose`                              |
| Disabled items                                     | `items[].disabled`                            | `options[].disabled`                              |
| Disabled trigger with explanation                  | `disabled`, `disabledReason`                  | `disabled`, `disabledReason`                      |
| Shortcut keycaps                                   | `items[].shortcut`                            | —                                                 |
| Dangerous actions and status footer                | `items[].danger`, `status`                    | —                                                 |
| Text search and search aliases                     | —                                             | `searchable`, `searchText`                        |
| Divider before an individual item                  | —                                             | `separatorBefore`                                 |
| Muted/default value                                | —                                             | `muted` on the selector or option                 |
| Long lists                                         | Bounded popup with native scrolling           | ScrollArea with a stationary current row          |
| Placement                                          | `placement`, `position`, `gap`                | Current-text alignment, automatic viewport bounds |
| Entrance animation                                 | Optional `motion`, direction and slide/reveal | Built in                                          |
| Custom trigger                                     | `triggerContent`                              | `display`, compact variant, IconValueMenu         |
| Arrow keys, Home/End, Escape and outside dismissal | Yes                                           | Yes                                               |
| Open-native-dialog portal and themed typography    | Shared MenuSurface                            | Shared MenuSurface                                |

Groups replace the flat item list when supplied. Both menus use
`{ label, items }` groups. Icons are caller-supplied React nodes; use decorative
SVGs with `aria-hidden="true"`. Shortcut keycaps display a binding, while the
host application implements the actual shortcut.

For example, ActionMenu already supports grouped commands with icons and
individually disabled items:

```tsx
<ActionMenu
  label="Actions"
  groups={[
    {
      label: "Session",
      items: [
        { label: "Restart", icon: <RestartIcon />, run: restart },
        { label: "Stop", icon: <StopIcon />, danger: true, run: stop },
      ],
    },
    {
      label: "Workspace",
      items: [
        {
          label: "Terminal",
          icon: <TerminalIcon />,
          shortcut: ["Ctrl", "`"],
          disabled: !connected,
          run: openTerminal,
        },
      ],
    },
  ]}
/>
```

The example's icons and action handlers come from the consuming application.

## Gallery

- **Overview** compares both menus using the same surface and trigger font.
- **Groups And Icons** shows titled groups, item icons and value-group icons.
- **States And Shortcuts** shows checked choices, disabled/default states,
  dangerous actions, shortcut keycaps and a status footer.
- **Search And Scrolling** compares long action lists with searchable value
  groups, per-item dividers and the stationary current row.
- **Placement And Motion** shows above/below/beside/custom placement and
  directional slide/reveal entrances.
- **Trigger Variants** compares ellipsis/text/icon action buttons and
  default/compact/icon-grouped value selectors.
- **Backdrop And Typography** exposes the shared blur over a dot pattern.
  Switch the Storybook theme to compare dark and light appearances.
- **Inside Dialog** shows both menus remaining interactive in a native dialog.

**Features** provides focused cases for disabled triggers, compact typography,
the animated Stipple backdrop, groups, disabled items, group/item icons and long
lists, including their searchable variants. Both menus use the same item labels,
icons, availability and selected value. Choosing an action or value updates both.
This keeps the common examples symmetric without implying that search or
group-title icons exist in ActionMenu.

## Custom overlays

`MenuSurface` is also exported for custom menus. Supply an `anchor` element,
position the surface with its div props/ref, and implement the appropriate
accessibility, focus and dismissal behavior. It portals into the anchor's
nearest open native dialog, or the document body otherwise, so menus remain in
the dialog's top layer. Inline typography styles can override the copied trigger
styles. Groups, icons, filtering and keyboard behavior are supplied by the
consumer when using this primitive directly.

Entrance transforms should release their animation state on completion. Check
settled menu edges using rendered pixels at fractional zoom as well as DOM
bounds: equal layout gaps can still paint differently in a retained animation.
