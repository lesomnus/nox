# AuroraGlow

`AuroraGlow` is the soft, moving color field from cxz's composer toolbar, adapted
to work without sessions or application styles. It uses CSS gradients, CSS
orbits and browser-interpolated Web Animations. It needs neither WebGL nor an
animation dependency.

```tsx
import { AuroraGlow } from "@lesomnus/nox";
import "@lesomnus/nox/styles.css";

<div className="toolbar">
  <AuroraGlow active={working} />
  <div className="toolbar-controls">{controls}</div>
</div>;
```

Give the host a position, a definite size and a radius. The decorative layer
fills that host and clips its own painting to the inherited radius. Keep the
foreground positioned above the layer. The layer is hidden from accessibility
APIs and does not intercept pointer input.

The host owns its border, background and optional translucent glass. This keeps
the effect usable behind toolbars, status surfaces or other content. A glass
foreground can soften the colors while leaving the outer edge visible; avoid
putting an opaque foreground over the entire effect. Storybook's
**Effects/AuroraGlow/Toolbar** shows this composition without importing a cxz
component. **Standalone** exposes the effect itself; **Lifecycle** demonstrates
activation, pausing and unmounting.

## Controls

- `active` blooms the glow when enabled and contracts it when disabled. Motion
  continues throughout contraction, then sleeps. Reactivation during contraction
  resumes from the current appearance and motion.
- `paused` freezes movement independently of `active`, keeping the visible glow.
- `palette` is a readonly tuple of three CSS colors, including CSS variable
  expressions. Updating it changes the colors without restarting the movement.
- `strength` controls overall opacity. Omit it to use the theme token.
- `speed` multiplies the motion rate; zero freezes movement. Bloom/contraction
  timing stays independent of movement speed.
- `seed` makes the random waypoint sequence reproducible. Omit it to choose a
  random sequence per mount. It is a repeatable motion sequence, not a clock
  shared between instances.
- Standard `div` attributes, `className`, `style` and `ref` target the decorative
  root. Children are intentionally excluded: place interactive content beside
  the layer, as shown above.

## Motion and layers

A **cluster** is a drifting group of three colors. Each color has an **orbit**
around the cluster, an **orb** that changes size, aspect and rotation, and a
small **hotspot** whose brightest point wanders within the orb. Orbs can shrink
away and return. An **envelope** grows and contracts the whole cluster while
the color field fades. Independent timelines keep the field from moving as
one rigid object.

Motion pauses when the document is hidden or the layer is outside the viewport.
Reduced-motion preferences keep an immediate, static glow while active. Browsers
without Web Animations keep the static gradient field. Unmounting cancels the
waypoint animations and releases observers, listeners and the contraction timer.
There is no per-frame JavaScript loop or per-frame React rendering.

## Styling

The effect's design values live in `src/theme/tokens.css` and its CSS Module.
Override the tokens on a host or individual layer:

- `--ui-aurora-color-1`, `--ui-aurora-color-2`, `--ui-aurora-color-3`: the palette.
- `--ui-aurora-strength`, `--ui-aurora-blur`: visibility and softness.
- `--ui-aurora-envelope-duration`: bloom and contraction timing.
- `--ui-aurora-drift-duration`, `--ui-aurora-form-duration`,
  `--ui-aurora-focus-duration`: waypoint cycle timing, sampled when the layer
  mounts or its seed changes. Use `speed` for live rate changes.
- `--ui-aurora-orbit-radius`, `--ui-aurora-orbit-rise`: horizontal and vertical
  orbit reach relative to each cluster.

The theme reduces the default strength on light surfaces. Explicit props become
inline custom properties; `style` can override them when needed. The effect
does not require a provider.
