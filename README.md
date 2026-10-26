# Nox

Reusable React 19 components with CSS Modules, monochrome theme tokens and portable
terminal and editor surfaces. Application state, networking and persistence stay
with the consuming application.

Package: `@lesomnus/nox` · Repository: [lesomnus/nox](https://github.com/lesomnus/nox)

[Browse Storybook](https://lesomnus.github.io/nox/)

## Develop

Node 22.12+ (CI uses Node 24), npm 11.

```sh
npm ci
npm run storybook
```

Open <http://localhost:6008>. Storybook uses TSX source with live updates.

```sh
npm run check
npm test
npm run build
npm run test:package
npm run build-storybook
npx playwright install chromium
npm run test:browser
```

`npm run dev` rebuilds JS, CSS and declarations after source edits for consumers
connected to `dist`. To compare the same app against source and compiled output:

```sh
npm run example:source
# In another run, after npm run build:
npm run example:dist
```

## Use in another project

The npm package is prepared for publication; creating this repository does not
publish a release. Until a release is published, build an installable archive:

```sh
# In the Nox repository:
npm ci
npm pack --pack-destination /tmp

# In the consuming project (replace the path for your environment):
npm install /tmp/lesomnus-nox-0.1.0.tgz
```

After publication, install a chosen version with `npm install @lesomnus/nox`.
Both development and production use compiled output by default.

```tsx
import "@lesomnus/nox/styles.css";
import { Button } from "@lesomnus/nox";

export function SaveButton() {
  return <Button onClick={() => save()}>Save</Button>;
}
```

[Local development and submodules](docs/local-development.md) explains how to
switch the same imports between compiled JS and TSX, and make upstream PRs from
inside a consuming project. The explicit `nox-source` condition selects source;
ordinary app development does not silently switch a package to source mode.

The base components inherit the host font and text color. Fixed-width UI text uses
`--ui-font-mono`, including elapsed times, numeric metrics, aliases and status
values. `monospaceFont()` resolves the same CSS token for canvas terminals and
editor defaults; explicit editor font settings still take precedence. The
stylesheet defines only namespaced tokens and styles for library component
classes; it does not reset the host's body, buttons or form fields. Dark is the
default palette. `ThemeProvider` adds light/dark/system controls and a reactive
`useTheme()` hook. Persistence defaults to localStorage (`nox.theme`), with an
injectable synchronous or asynchronous storage backend. See [themes](docs/theme.md).
Set `data-ui-theme="light"` on the document root for CSS-only use.
Root-level `--ui-*` overrides also reach portaled menus and dialogs. Keep
token values in CSS rather than duplicating design measurements in documentation.

`CompactNumber` accepts a `digits` prop only with `mode="integer"`. For example,
`<CompactNumber value={7} mode="integer" digits={3} />` reserves three numeric
cells and renders `007`, with padding zeroes dimmed. Omitting `digits` retains
four integer cells. Use a positive integer; unavailable and overflow indicators
stay within the same width, and the accessible label preserves the original
value. Compact mode keeps its fixed numeric/unit layout and rejects `digits`.
The effective digit of a displayed zero uses the intermediate text color instead
of the normal value color. Set `muted` to use that intermediate color for
significant digits of any value in either mode, for example
`<CompactNumber value={7} mode="integer" digits={3} muted />`. Padding zeroes
stay darker; number formatting, reserved width and accessible labels are unchanged.

Formatted text shares three color roles across `ElapsedTime`, `CompactNumber`,
`DurationDisplay` and `DateTime`:

- `--ui-text-value`: significant digits and values.
- `--ui-text-separator`: punctuation, decimal points and unit labels.
- `--ui-text-leading`: padding zeroes and insignificant leading fields.

The roles reference the theme palette, so they follow dark/light changes. Override
them on the document root or a component container to customize these displays
together. General labels and descriptions continue to use `--ui-muted`.

Storybook's **Layout** category groups `PageToolbar`, `NavigationPanel`,
`SplitLayout`, `ResizeHandle` and `ScrollArea`: page headers, bounded panels,
split panes, resize boundaries and scrolling regions. They compose arbitrary
content and leave routing, data and application state to the caller.

`PageToolbar` provides a persistent page header with leading content and optional
trailing `actions`. Put a selector, breadcrumbs or title in its children and keep
scrolling content in a sibling below it. It has no routing or resource dependency.

`PinInput` presents one native input as configurable code slots. Use `length={6}`
for a numeric verification code or `groups={[4, 4]}` with `mode="alphanumeric"`
for device codes. Typing advances the visible caret; paste, autofill, native form
submission and keyboard editing work with one unformatted value. See
[PIN and device codes](docs/pin-input.md) and **Components/PinInput**.

`DatePicker` selects single dates, multiple dates or continuous date ranges from
an anchored Gregorian calendar. It exchanges date-only `YYYY-MM-DD` values,
supports controlled/uncontrolled state, native form values/reset, bounds and
unavailable dates, and localizes labels without shifting dates across time zones.
`getDateInfo` adds holidays, descriptions, markers and styles; `getSelectionDates`
maps a click to an atomic date group. The `dateWindowSelection` and
`dateWeekSelection` presets work with multiple/range modes. It shares menu and
scroll components, including inside dialogs. See
[date selection](docs/date-picker.md) and **Components/DatePicker** for examples
and keyboard controls.

`Progress` provides a boxed progress rail with optional InkSparkle animation
from a fixed center outside its left edge. The bordered variant uses the shared
narrow control inset. Value, timing and animation state belong to the host.
See [progress indicators](docs/progress.md) and **Components/Progress**.

`SlidingPages` and `SlidingPage` keep a multi-step form inside one clipped
viewport. Control the active value, preserve page drafts and choose fixed size,
animated height or animated width and height. They support directional slides,
RTL, focus transfer and reduced motion without a routing or animation dependency.
See [sliding pages](docs/sliding-pages.md) and **Components/SlidingPages**.

`Card` provides the shared heading, inset body and footer for inline content,
dialogs and drawers. `fill` and `bodyPadding` adapt it to a bounded container.
See [cards](docs/card.md) and **Components/Card**.

`SectionLayout`, `SectionGroup` and `Section` compose spaced entries and their
related borderless surfaces. The column supports bounded or full width and start
or center alignment; related sections share compact inner corners and a rounded
outer silhouette. See [section layouts](docs/section-layout.md) and
**Layout/SectionLayout**.

`Drawer` places an independently sized surface near any viewport or container
edge. Compose `Card` for the rounded cxz task-detail card, or supply a
different surface. See [drawers](docs/drawer.md), **Components/Drawer** and
**Components/Card**.

`PrefixValueMenu` combines leading text, an icon or another React node with a
compact `ValueMenu` and a shared hover, focus and open background. Its `prefix`
stays outside the trigger and popup; `label` supplies the accessible selector name.
The selected value retains its text position when the menu opens.
`--ui-icon-size` and `--ui-icon-size-small` define regular and compact glyph
sizes; the prefix slot scopes its SVG glyphs to the compact token. Value menus share
the dialog entrance motion while their selected row stays in place. Reduced
motion disables the entrance animations.

`IconValueMenu` is a deprecated compatibility wrapper: `icon` maps to `prefix`
and `iconClassName` maps to `prefixClassName`, using the same implementation.

`DialogTrigger` requires `adjacent` to show a disabled visual copy above a modal
backdrop. Use it only when the dialog actually sits beside its source. Centered
confirmations and dialogs docked to a screen edge leave the source under the
backdrop. If an anchored dialog cannot fit beside its source after a resize,
hide its foreground trigger until adjacent placement is restored.

`BadgedIcon` leaves its icon child unchanged and places a separate badge above
it. An SVG luminance mask removes the icon under and around the badge; the gap
reveals the actual background rather than drawing a background-colored border.

```tsx
<BadgedIcon badge={<UnreadCounter count={unread} />} position="top-right">
  <ChatIcon />
</BadgedIcon>
```

Choose a corner with `position`, or move the badge with `badgeStyle` or
`badgeClassName`. The mask follows its measured position, size, direct style
updates, resizes and CSS movement animations. Ellipse is the default; use
`shape="rounded-rectangle"` for a pill or rectangle, following its CSS radius or
an explicit `radius`. Irregular silhouettes need a different mask shape. `gap`
uses local CSS pixels; omitted gaps follow the icon's SVG stroke after viewport
scaling, with `--ui-badged-icon-gap` as the fallback for icons without strokes.
The component has no application dependencies or idle animation loop. See
**Components/BadgedIcon** for movable, animated and patterned-background examples.
[SVG effects on HTML](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/Applying_SVG_effects_to_HTML_content)
describes the underlying mask mechanism.

The public core entry exports Button/ButtonAnchor/ButtonContent, BorderTrailButton, BadgedIcon, ConfirmButton, ActionMenu, ValueMenu, SegmentedControl, Switch, Dialog/DialogHeader/DialogTitle/DialogDescription/DialogBody/DialogFooter, EditableValue, FloatingCard, SettingField, SettingSlider, ElapsedTime, CompactNumber, DurationDisplay, DialogReveal, SplitLayout, ResizeHandle, ScrollArea and UIProvider. Button's `toolbar` variant provides the compact rectangular shape. [ButtonAnchor](docs/button-anchor.md) and PanelItemAnchor share its native-link press feedback. Button defaults to `effect="sparkle"`; use `effect="none"` to opt out or `effectOptions` to customize ink color/timing. Callbacks and selected values belong to the consuming application; Application adapters handle persistence and session operations separately.

[BorderTrailButton](docs/border-trail-button.md) moves configurable colored segments
along the button outline. Use a count and palette or individual lengths, offsets
and lap times. The outline follows CSS corner radii and stays fixed while the
label scales on press. **Components/BorderTrailButton** covers multiple colors,
custom segments, shapes, inactive/disabled states and interaction.
Its `progress` mode grows one color before introducing the next, and optional
`sheen` sends light along each segment without leaving its outline. Progressive
and Sheen stories isolate these behaviors.

`Dialog` provides the modal lifecycle and focus boundary; compose its header,
body and footer freely. Confirmation buttons, async execution and failure policy
belong to the consumer. See [composable dialogs](docs/dialog.md), including the
migration from the former `ConfirmationDialog` export.

`ActionMenu` and `ValueMenu` share the exported `MenuSurface` for portaling,
themed foreground/background, blur, frame and trigger typography. Their rows,
icon slots, group labels and dividers use the same exported `MenuItem`,
`MenuIcon`, `MenuGroupLabel` and `MenuDivider` parts. Both use `MenuScrollArea`
for the same scrollbar, rail, edge fades and item clearance. Selection,
actions, placement and keyboard behavior belong to each menu. The top-level
**Menus** Storybook gallery collects shared appearance and feature examples.
**Menus/Features** compares both menus side by side using the same items;
**Components/ActionMenu**, **ValueMenu** and **PrefixValueMenu** keep their basic API
controls and component-specific cases. See [menu overlays](docs/menu-surface.md)
for the capability table.

`Checkbox`, `Radio`, `CopyButton`, `IdentifierValue`, `DateTime`, `FieldLabel`,
`DescriptionList` and `NavigationPanel` provide native selection, clipboard
feedback, stable identifier previews, local timestamps and compact record views.
They share the existing tokens, work without application CSS or services, and
have independent Storybook examples. See [navigation and record details](docs/resource-components.md)
and **Integration/RecordBrowser** for their composition and accessibility contracts.

`SplitLayout` takes a controlled `SplitNode` tree, a `renderPane` callback, and
`onChange={setTree}`. The callback receives the complete next tree. Dividers
connect at their centerlines. Drag a junction to resize both axes together.
Aligned opposing segments share hover and drag behavior, including at size limits.
Dragging an offset segment near its opposite snaps it into alignment; releasing
joins the line for subsequent drags. A wider release zone prevents snap jitter.
Double-click then drag, or drag on the second press, to detach just one segment
without snapping back. These joins follow the controlled tree's geometry rather
than adding hidden layout metadata. At an aligned four-way crossing, detaching
a continuous ancestor boundary rotates the split tree so either half can move
independently. Pane IDs and their initial positions are retained. Cancellation
restores the original tree and positions. An unsplit pane at a T junction cannot
be divided this way.
Separators support pointer dragging, arrow keys, Home/End and double click to
equalize a standalone split. Junctions accept all four arrow keys and Enter/Space
to equalize the connected splits. `separatorLabel` and `junctionLabel` name the controls.
The legacy `onResize` alternative supports ratio updates but cannot restructure
the tree to detach a continuous ancestor boundary. Use functional state updates
with that callback because one gesture can update multiple IDs:
`setTree(current => setSplitRatio(current, id, ratio))`.
See **Layout/SplitLayout** for nested, transposed, crossing and offset examples.
Line thickness and hover thickness share `--ui-split-line-size` and
`--ui-split-line-hover-size`. Snap entry/release distances and double-click timing
use the `--ui-split-*` tokens in `src/theme/tokens.css`.
It owns no workspace connections or tabs, so it can lay out arbitrary content in
other applications. When moving expensive stateful content between panes, keep
its instance outside the changing tree and attach a stable portal host to pane
slots, as the terminal integration does.

`ResizeHandle` controls one neighboring pane in pixels. Supply `value`, responsive
`min`/`max` limits and `onChange`; `axis` selects horizontal or vertical resizing.
It captures pointer drags, supports arrow keys and Home/End, and accepts optional
`onReset` for double click. The host owns layout and content; the handle does not
remount either pane. Its appearance follows the same separator tokens as split layouts.

## Scroll areas

`ScrollArea` is exported from the core entry. It owns native vertical scrolling,
the centered growing rail, capped handle, hover/focus/drag interaction and edge
fades. Its styles and defaults belong to this package; it needs no application CSS,
connection, router or provider. Supply bounded height, or place it in a flex
parent whose height is constrained.

```tsx
import "@lesomnus/nox/styles.css";
import { ScrollArea } from "@lesomnus/nox";

<ScrollArea className="document-scroll" scrollbarLabel="Scroll document">
  <Article />
</ScrollArea>;
```

Size `.document-scroll` in your stylesheet. `viewportRef` points to the native
scroll element for reading position or scrolling programmatically; `onScroll`
receives its scroll events. `viewportClassName`, `contentClassName` and
`classNames` customize slots. Override `--ui-scroll-area-background` to match
the containing surface and its fades; rail geometry, handle appearance and
fade limits use the other `--ui-scroll-area-*` CSS tokens. Defaults live in
`src/theme/tokens.css`. Use signed `scrollbarOffset` values to move handle centers relative to the
container edge: positive goes outside, negative inside, and zero sits on the edge.
Omitting it preserves existing placement. Leave room in the parent for outside
handles and avoid clipping ancestors. See [ScrollArea](docs/scroll-area.md)
and **Layout/ScrollArea** for placement, short/long overflow, growing content
and no-overflow examples. Content fetching and
virtualization belong to the caller. An application's elastic transcript
scrollbar remains specialized; it is not part of this primitive.

## Animated backgrounds

`AuroraGlow` is a clipped CSS-gradient layer adapted from cxz's composer toolbar.
Drifting clusters contain orbiting colors, changing orb shapes and moving bright
centers. Control activation, pausing, palette, strength and motion speed without
application state or WebGL. It blooms when work starts and contracts while
continuing to move when work ends. The host owns its size, glass and controls;
hidden/offscreen motion pauses and reduced-motion preferences stay still. See
[aurora glow](docs/aurora-glow.md) and **Effects/AuroraGlow** in Storybook.

`StippleBackground` provides a WebGL2 metaball background with five stipple
patterns, a configurable cluster palette and controlled motion. Only dots are
drawn, including where clusters grow and disappear inside the viewport. Each
mount uses a random arrangement unless a reproducible seed is supplied. Overlaps
can interpolate colors or interleave dots of the original palette colors.
Optional `edgeFade` softens dot colors at the edges; `edgeFadeSteps` caps the
additional shades, defaulting to one halfway-to-background shade. A
time-based motion callback can control metaball positions, size and shape. The
original movement is also exported as the reusable `clusterMotion` preset.
`workMotion` uses `active` to bloom interacting metaballs when work starts and
shrink them away while still drifting when it finishes. It fills its container,
keeps children interactive, pauses when hidden or offscreen, and respects reduced
motion. Unsupported or lost WebGL contexts show the background color; restored
contexts resume rendering. See [stipple background](docs/stipple-background.md)
and **Effects/StippleBackground** in Storybook.

## Terminal workbench

The separate terminal entry provides tabs, drag docking, nested resizable panes,
status/clipboard feedback and folding. It does not install xterm, open sockets or
look up projects. Supply your own session renderer and keep connection and settings adapters in
the application.

```tsx
import { TerminalWorkbench } from "@lesomnus/nox/terminal";

<TerminalWorkbench
  visible={visible}
  hide={() => setVisible(false)}
  renderSession={(props) => <MyTerminalSession {...props} connect={connect} />}
/>;
```

`TerminalSurfaceProps` describes the renderer contract:

- Each `id` owns a stable mounted session. `groupId` and `placement` change when
  docking; they must not become connection effect dependencies.
- Create a stable DOM host, render its content with a React portal, and attach it
  to `getHost(groupId)` in a layout effect. Hide inactive hosts with `active`.
  Remove the host in a layout-effect cleanup so StrictMode replay is safe.
- `visible`, `active` and `focused` drive fitting and focusing without reconnecting.
  The `ref` exposes `focus()` and `reconnect()`. Report focus with `onFocus(id)`.
- Report connection state, ended state and clipboard feedback with `onStatus`.
  The host can supply an `error`, `formatStatus`, `hideShortcut` and `className`.
  UIProvider translates built-in labels; terminal sizing uses `--ui-*` tokens.

**Components/TerminalWorkbench → Portable** demonstrates the complete contract
using plain React inputs without application providers or CSS. Its drafts and
submitted lines survive tab moves, split-tree rebuilds and folding. This entry
can move to a dedicated terminal package later without changing the application
transport boundary.

## Translation

English defaults work without a provider. To use an application's translation system, supply a translator and a locale identifier. Changing the locale refreshes component labels; the package itself downloads no language packs and writes no browser storage.

```tsx
import { UIProvider } from "@lesomnus/nox";

<UIProvider
  locale={locale}
  translate={(message, values) => translate(message, values)}
>
  <App />
</UIProvider>;
```

## Popover

`Popover` provides shared hover/focus overlays for text and React content, with
controlled DOM anchors, viewport-aware placement and in-place text overlays.
See [Popover](docs/popover.md) for its API and examples.

## Optional source editor

Install `monaco-editor` when using the separate editor entry. Importing the core entry does not load Monaco, its language services or its workers.

```tsx
import { SourceEditor } from "@lesomnus/nox/editor";

<SourceEditor
  path="example.ts"
  value={source}
  ariaLabel="Source code"
  theme={theme}
  settings={editorSettings}
  onChange={setSource}
/>;
```

The editor accepts plain settings and theme values; it does not know about settings.json, font downloads or application storage. It loads Monaco lazily and ships editor/JSON worker assets. An existing host MonacoEnvironment is respected. The host gives the editor a bounded layout area. The explicit `nox-source` condition uses source files for Vite hot reload; the default uses compiled ES modules and TypeScript declarations.

A failed module fetch is retried once through a separate bundled entry, avoiding
the browser's cached failed URL without reloading the host page. Persistent fetch
failures and editor evaluation errors are reported in the editor surface.

## Independent previews

The [published Storybook](https://lesomnus.github.io/nox/) follows `main`.
The **Storybook Pages** workflow builds and deploys it on each push to `main`,
and can also be run manually from GitHub Actions. GitHub Pages uses the
**GitHub Actions** publishing source. Build output is uploaded as a deployment
artifact; it is not committed to the repository.

`npm run storybook` imports only this package and documentation framing. Its
stories demonstrate controls, value editing, menus, cards, injected translation,
terminal docking and the optional editor without application providers or CSS.

## Source layout

`src/components/<component>/` keeps implementation, CSS Modules and examples
together. Portable terminal layout lives in `src/terminal`, the optional editor
in `src/editor`, translation in `src/providers`, and tokens in `src/theme`.
Integration stories live in `src/stories/integration`.

Use public package entries rather than internal component paths. Core imports do
not load the optional Monaco editor. React and React DOM are peer dependencies.
See [ORIGIN.md](ORIGIN.md) for extraction provenance.

See [design guidelines](docs/design-guidelines.md) for recommended popup spacing
symmetry and concentric nested corners.

### Duration and popup reveal

`DurationDisplay` accepts `durationMs`, optional `rounding="ceil"` for countdowns,
and an optional accessible `label`. It renders `00d00h00m` in nine fixed cells,
sharing CompactNumber's dim padding and intermediate unit colors. The consumer
owns clock updates; the component also works for static durations.

`DialogReveal` wraps custom popup content using the same stable frame and
masked blur entrance as ActionMenu. Set `from="right"` (or another menu direction),
`className` for the frame and `contentClassName` for the content layout. Mount it
when the popup opens to replay the entrance. See [design guidelines](docs/design-guidelines.md).

`InkSparkle` is a reusable Material 3 ink effect with Flutter's original shader.
Choose `duration` to control speed, `origin` and `centerMotion` to place the
center (including outside the surface), and `loop` for repeated bursts. It plays
once by default and supports `onComplete` for overlay cleanup. See
[InkSparkle](docs/ink-sparkle.md) and **Effects/InkSparkle** in Storybook. Switch
uses the same public effect with a slower 2000ms burst and a fixed center outside
the rail.

`color` controls the ink, while `sparkleColor` independently controls the
normalized RGBA color of sparkling pixels. Its alpha softens or hides the
sparkles without fading the ink. Both props are also available through
`Button.effectOptions`. InkSparkle keeps the original white sparkles by default;
Button defaults to white sparkles with alpha `0.5`.
