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
default palette. Set `data-ui-theme="light"` on the document root for the light
palette. Root-level `--ui-*` overrides also reach portaled menus and dialogs. Keep
token values in CSS rather than duplicating design measurements in documentation.

Formatted text shares three color roles across `ElapsedTime`, `CompactNumber`,
`DurationDisplay` and `DateTime`:

- `--ui-text-value`: significant digits and values.
- `--ui-text-separator`: punctuation, decimal points and unit labels.
- `--ui-text-leading`: padding zeroes and insignificant leading fields.

The roles reference the theme palette, so they follow dark/light changes. Override
them on the document root or a component container to customize these displays
together. General labels and descriptions continue to use `--ui-muted`.

`PageToolbar` provides a persistent page header with leading content and optional
trailing `actions`. Put a selector, breadcrumbs or title in its children and keep
scrolling content in a sibling below it. It has no routing or resource dependency.

`IconValueMenu` combines a decorative icon and compact `ValueMenu` with a shared
hover, focus and open background. The icon stays outside the trigger and popup;
the selected value retains its text position when the menu opens.
`--ui-icon-size` and `--ui-icon-size-small` define regular and compact glyph
sizes; the icon field scopes its glyphs to the compact token. Value menus share
the dialog entrance motion while their selected row stays in place. Reduced
motion disables the entrance animations.

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

The public core entry exports Button/ButtonContent, BadgedIcon, ConfirmButton, ActionMenu, ValueMenu, SegmentedControl, Switch, ConfirmationDialog, EditableValue, FloatingCard, SettingField, SettingSlider, ElapsedTime, CompactNumber, DurationDisplay, DialogReveal, SplitLayout, ResizeHandle, ScrollArea and UIProvider. Button's `toolbar` variant provides the compact rectangular shape. Callbacks and selected values belong to the consuming application; Application adapters handle persistence and session operations separately.

`Checkbox`, `Radio`, `CopyButton`, `IdentifierValue`, `DateTime`, `FieldLabel`,
`DescriptionList` and `NavigationPanel` provide native selection, clipboard
feedback, stable identifier previews, local timestamps and compact record views.
They share the existing tokens, work without application CSS or services, and
have independent Storybook examples. See [navigation and record details](docs/resource-components.md)
and **Integration/RecordBrowser** for their composition and accessibility contracts.

`SplitLayout` takes a controlled `SplitNode` tree, a `renderPane` callback, and `onResize`. `setSplitRatio` applies a bounded ratio update to that tree. Separators support pointer dragging, arrow keys, Home/End and double click to equalize; the host supplies the accessible separator label. It owns no workspace connections or tabs, so it can lay out arbitrary content in other applications. When moving expensive stateful content between panes, keep its instance outside the changing tree and attach a stable portal host to pane slots, as the terminal integration does.

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
`src/theme/tokens.css`. See **Components/ScrollArea** for short overflow, long
lists, growing content and no-overflow examples. Content fetching and
virtualization belong to the caller. An application's elastic transcript
scrollbar remains specialized; it is not part of this primitive.

## Animated backgrounds

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
