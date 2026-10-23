# Stipple background

`StippleBackground` is a decorative WebGL2 background adapted from the supplied
Diamond Stipple Aurora Metaballs wallpaper. Same-color pairs drift, merge and
separate. Only patterned dots are drawn; the solid shapes used to debug the
original wallpaper are hidden.
It uses the browser GPU directly and adds no runtime dependency.

```tsx
import { StippleBackground } from "@lesomnus/nox";

<StippleBackground className="welcome-background" pattern="diamond">
  <Welcome />
</StippleBackground>;

// Choose cluster colors; a single color also works.
<StippleBackground
  className="welcome-background"
  palette={["#f6bd60", "#f28482", "#84a59d", "#b8b8ff"]}
/>;
```

Give the component a size through its class or content. Its canvas fills and
stays inside that container. For a wallpaper, position the component over the
viewport in the consuming application's stylesheet. The component does not style
the document or install global keyboard shortcuts. Children remain interactive
above the decorative canvas, which is hidden from assistive technology.

## Terminology

- **Metaball**: an invisible, rounded influence field. “Ball” is understandable,
  but “metaball” describes how nearby fields blend together. It is not a drawn
  sphere or a separate solid layer.
- **Cluster**: a pair of metaballs sharing a color and a drifting center. The
  metaballs orbit that center, merge and separate while their radii change.
- **Density field**: the combined influence that determines where dots appear.
- **Stipple dot**: an individual visible dot. The background is drawn entirely
  from these dots, including the centers of clusters.
- **Palette**: the candidate colors assigned to clusters. Same-color fields can
  merge. Larger palettes are sampled over successive cluster lifetimes.

## Controls

- `pattern`: `bayer8`, `checker`, `diamond`, `hex`, or `fractal`.
- `speed`: simulation time multiplier. Zero keeps a still image.
- `grainPx`: grain spacing before the lattice multiplier, in CSS pixels.
- `scatterPx`: the spread of the stippled edge. Retains the supplied shader's
  square-root compression so large values produce gradual falloff.
- `merge`: blending distance for same-color metaballs, in height-normalized
  coordinates. Zero keeps their distance fields separate.
- `colorBlend`: `gradient` interpolates dot colors across overlapping fields;
  `dither` interleaves dots of the original palette colors. `none` uses the
  nearest field's color without a transition.
- `colorBlendWidth`: the color transition width in height-normalized
  coordinates. Larger values make overlaps blend more broadly; zero disables
  mixing. This changes color mixing independently of `merge` and dot density.
- `edgeFade`: peripheral dot colors fade toward `backgroundColor` as the field
  weakens. Zero keeps the original flat colors; one applies the configured shade
  ramp at full strength.
  Intermediate values adjust the strength. It works with every color blend
  mode and motion, without changing the dot placement or occupancy rule.
- `edgeFadeSteps`: maximum additional fade shades per selected base dot color,
  excluding the original color. Defaults to one, adding a shade halfway toward
  the background. Larger counts divide that range into evenly spaced shades;
  zero disables color attenuation. Fractional counts are rounded down.
- `motion`: an optional `(t, context) => metaballs` callback that replaces the
  built-in movement. See the contract and example below.
- `active`: a work/activity signal for lifecycle-aware motions such as
  `workMotion`, defaulting to true. Unlike `paused`, false lets an exit animation
  finish. The original `clusterMotion` does not use this signal.
- `pointerEffects`: enable local pointer input for composed effects. Defaults
  to true; it adds no visible effect unless the motion uses that input.
- `palette`: a list of cluster colors, using short or full RGB hex strings.
  Empty or entirely invalid palettes use the defaults; invalid entries are
  ignored. Palette changes preserve the current motion.
- `colors`: the original three-color shorthand. `palette` takes precedence.
- `backgroundColor`: a short or full RGB hex string, also used for the fallback.
- `seed`: reproducible initial positions and motion. When omitted, a random
  seed is chosen once per mounted instance and remains stable across rerenders.
  Remounting picks a new arrangement. Providing a seed makes it reproducible;
  changing it restarts the arrangement. Ordinary control changes preserve the
  current simulation time.
- `paused`: freeze the current image; resuming continues from that point.
- `maxWidth`: cap the drawing buffer width while keeping the CSS container size.
- `maxFps`: drawing rate limit.
- `onError`: optional notification when WebGL cannot initialize or loses its
  context. The content stays available over the static background color.

Defaults live in `stipple-model.ts`. The drawing budget also respects device
pixel ratio and the GPU's render-buffer size limit. The shader and uniform buffers
are reused as props change; rendering does not update React state every frame.

## Color at intersections

**Gradient blending** gives each dot an interpolated color based on the nearby
fields' relative influence. The colors change gradually as fields meet and
separate. **Dither blending** uses the same influence weights to decide which
original color each dot receives. The proportion of each color changes through
the overlap, while individual dots keep their palette colors. A stable spatial
hash makes these choices; a still image does not reshuffle its dots every frame.
Dots remain solid in both modes. Colors are sampled at the dot's center, so a
dot crossing a boundary is not split into differently colored pieces.

```tsx
<StippleBackground colorBlend="gradient" colorBlendWidth={0.16} />;
<StippleBackground colorBlend="dither" colorBlendWidth={0.16} />;
```

The built-in pairs share their cluster's color, so these transitions appear
between differently colored clusters. A custom motion can also assign different
palette indices to the metaballs in a pair.

To soften the outer edge as well as the dot density, enable color falloff:

```tsx
// Original color plus one halfway-to-background shade (the default).
<StippleBackground edgeFade={1} edgeFadeSteps={1} />;
// Original color plus up to three additional shades.
<StippleBackground colorBlend="dither" edgeFade={1} edgeFadeSteps={3} />;
```

Strong parts of the field keep their color; peripheral dots choose a weaker
shade based on the density at the dot center. Every pixel in a dot uses the same
color. The default shade is halfway between the original and background RGB;
against black, this halves each color channel. More steps add evenly spaced
shades, with the background itself reserved for the gaps between dots.

`edgeFade` adjusts the strength of the shade ramp without adding more shades.
With `dither`, the palette color is selected first, then shaded; exact palette
RGB values are preserved when `edgeFade` or `edgeFadeSteps` is zero. The shade
budget applies per selected base color: `gradient` blending can still create
interpolated base colors at intersections. `none` and `dither` retain the finite
base palette. The canvas remains opaque and its fallback background is unchanged.

## Custom motion

`motion(t, context)` returns a readonly array of `StippleMetaball` samples. It is
called synchronously when the renderer draws, without triggering a React render.
The result replaces the built-in clusters; return an empty array to draw only
the background. The renderer packs the samples into reusable GPU buffers. Up to
`MAX_STIPPLE_METABALLS` entries are accepted; later entries are ignored to bound
the fragment shader's work. Invalid positions and invisible samples are skipped.

- `t` is elapsed simulation time in seconds, after `speed` is applied. It starts
  at zero, freezes during pause/reduced motion/hidden/offscreen states, and resets
  when `seed` changes. Changing the callback preserves the clock.
- `context` provides readonly `width` and `height` in CSS pixels, `aspect`, and
  the resolved `seed`, `active` and `reducedMotion` flags. The renderer reuses this context object; read its current
  values during the callback rather than retaining it as a snapshot.
- `context.elapsed` is the unscaled animation clock. Like `t`, it freezes while
  paused, hidden/offscreen, at zero speed or under reduced motion. Pointer bursts
  use it so their short lifetime stays responsive when the base motion is slow.
- `context.pointer` contains the latest local mouse/pen position in viewport
  fractions, an `inside` flag, a movement `sequence` and a `path` identifier
  that changes when the path resets. It is absent when `pointerEffects` is
  false. A stationary pointer does not change the sequence.
- `x` and `y` are viewport fractions. The origin is top-left and the opposite
  corner is `(1, 1)`. Values outside that range allow entry and exit motion.
- `radius` is a fraction of container height. `scale: [x, y]` makes an ellipse;
  `rotation` turns it clockwise in radians. `wobble` controls organic boundary
  deformation; omit it for a smooth circle or ellipse. Ellipse distances use an
  approximation, so strongly stretched shapes can have a different falloff.
- `deformation` adds a liquid silhouette, from zero to one: broad moving lobes
  and a localized inward dent. Unlike ellipse stretching, it can make the
  outline concave without cutting a hole through the field. It defaults to
  zero and composes with `scale`, `rotation` and the finer `wobble` ripples.
  These animated outlines also use an approximate distance field.
- `color` indexes the current palette and wraps when outside its range. When
  omitted, the sample's array index selects the color.
- `influence` is a growth/fade envelope from zero to one. It scales both radius
  and field influence; zero makes the metaball disappear completely. It defaults
  to one. You can also animate `radius` and `scale` directly.

```tsx
import { StippleBackground, type StippleMotion } from "@lesomnus/nox";

const orbit: StippleMotion = (t, { aspect }) => [
  {
    x: 0.5 + (0.15 / aspect) * Math.cos(t * 0.3),
    y: 0.5 + 0.15 * Math.sin(t * 0.3),
    radius: 0.16,
    scale: [1.5, 0.7],
    rotation: t * 0.2,
    color: 0,
  },
  {
    x: 0.5,
    y: 0.5,
    radius: 0.2,
    influence: 0.5 - 0.5 * Math.cos(t * 0.2),
    color: 1,
    wobble: 1,
    deformation: 0.8,
  },
];

<StippleBackground
  className="welcome-background"
  palette={["#ff6b9d", "#70e1d0"]}
  motion={orbit}
  colorBlend="dither"
/>;
```

Keep the callback quick and synchronous. Derive samples from time and seed
instead of choosing fresh random values every frame. A stable array order keeps
metaball identities and their deformation phases consistent. Samples may reuse
your own objects and array; the renderer does not modify them. React state
updates are unnecessary inside the sampler. A thrown callback reports through
`onError` and suspends animation over the fallback background; a corrected
callback or setting update can resume rendering.

## Predefined motions

`clusterMotion` is the original movement, exported as a `StippleMotion` function.
It combines paired metaballs orbiting a drifting center, merging and separating,
with staggered growth and disappearance inside or across the viewport. Omitting
`motion` and passing `motion={clusterMotion}` use the same implementation.

```tsx
import { StippleBackground, clusterMotion } from "@lesomnus/nox";

<StippleBackground className="welcome-background" motion={clusterMotion} />;
```

The function can be shared by multiple backgrounds. Each renderer's context
keeps its own cached samples; seed, time and aspect determine the result.
Sampling a later or earlier time produces the same result regardless of frame
cadence. The preset computes the current lifetime directly rather than replaying
every intervening animation frame.

Compose it with a custom callback to keep its paths and adjust individual fields:

```tsx
import {
  StippleBackground,
  clusterMotion,
  type StippleMotion,
} from "@lesomnus/nox";

const stretchedClusters: StippleMotion = (t, context) =>
  clusterMotion(t, context).map((ball) => ({
    ...ball,
    scale: [1.6, 0.7],
    rotation: t * 0.1,
  }));

<StippleBackground
  className="welcome-background"
  motion={stretchedClusters}
  colorBlend="none"
/>;
```

The preset reuses its returned array and sample objects. Read them during the
callback and copy the fields you want to change, as in the example; do not mutate
or retain those samples as snapshots. Palette and color blending remain separate
component controls.

### Work lifecycle

Use `workMotion` when the background accompanies an ongoing task:

```tsx
import { StippleBackground, workMotion } from "@lesomnus/nox";

<StippleBackground
  className="work-background"
  motion={workMotion}
  active={isWorking}
  palette={["#b8e0f2", "#b3e6bd", "#c2baf0"]}
/>;
```

Keep the component mounted when work finishes so its exit can play. Initially
inactive backgrounds have no dots. Starting work grows some metaballs within
the viewport and brings others in from outside. Entrances are staggered, with
slow growth rather than a simultaneous bloom. Small and large metaballs breathe
at independent rhythms, with slowly changing shapes. Interior paths start in
independent directions instead of converging toward a shared center.
The Work Motion example uses a narrower `scatterPx` than the wallpaper examples;
a broad, shared stipple falloff can make differently sized fields look alike.

They drift with inertia and weak, local attraction. Size-aware repulsion leaves
more room between large fields. Each pair receives equal and opposite forces;
a soft boundary and gentle wandering keep the movement contained without
bouncing at the edge. Incoming fields can approach gradually before the boundary
keeps their subsequent wandering near the viewport.

While work stays active, each metaball also has its own lifetime. It keeps
drifting as it slowly shrinks to nothing, rests invisibly, then blooms again at
a new interior or offscreen position. Lifetimes are staggered so the background
keeps changing without the whole population disappearing together. New positions
are chosen only while a field is fully invisible.

Finishing work preserves positions and velocities while the metaballs shrink
at different rates. Individual lifetimes pause, so no new fields are born during
the exit. Starting again during this fade regrows the current fields
instead of replacing them. Once every field disappears, the direct
`motion={workMotion}` preset stops requesting animation frames; starting work
wakes it again. The canvas then shows only `backgroundColor`, not transparency.
`speed` controls both movement and entrance/exit timing. `paused` freezes both.
With reduced motion, active work has a static composition and finishing hides
the fields immediately.

This preset integrates forces in bounded, fixed steps and caches its own state
per renderer context. Share the function freely across backgrounds. Consecutive
samples produce the same seeded paths regardless of normal frame cadence.
Large time jumps cap catch-up work; backwards seeking or changing the seed
restarts the simulation. Unlike `clusterMotion`, it is a stateful simulation,
not an arbitrary-time path sampler. Custom wrappers can read `context.active`
and compose the returned samples. Automatic idle sleeping recognizes the direct
preset and `withPointerBurst` compositions; arbitrary wrappers manage their own
idle behavior. Both presets reuse their arrays and samples.

## Pointer bursts and composition

`withPointerBurst` decorates any `StippleMotion` with transient metaballs along
the pointer's path. They bloom briefly, travel radially away from their birth
point and immediately shrink until completely gone. A stationary pointer stops
emitting. Leaving the container resets the anchor, so returning does not draw a
bridge across the gap. Finishing work stops new emissions while existing bursts
disappear; reduced motion clears the transient effect.

```tsx
import { StippleBackground, workMotion, withPointerBurst } from "@lesomnus/nox";

// Keep the composed function stable, at module scope or with useMemo.
const interactiveWork = withPointerBurst(workMotion);

<StippleBackground
  className="work-background"
  motion={interactiveWork}
  active={isWorking}
  pointerEffects={pointerEnabled}
/>;

// The same decorator works with your own callback or another preset.
const interactiveCustomMotion = withPointerBurst(myMotion, {
  maxParticles: 12,
});
```

The component collects local pointer input; creation, outward travel and
disappearance happen in the composed motion. Custom callbacks can also read
`context.pointer` directly. Switching `pointerEffects` off stops emission and
lets existing bursts finish without resetting the base simulation. The Work
Motion story includes a **Pointer bursts** switch; other stories keep their
existing motions.

The decorator keeps original samples first and reuses a bounded particle pool
and output array. Base fields take priority within `MAX_STIPPLE_METABALLS`; a
full base population leaves no room for bursts. `maxParticles` caps the added
fields, and emissions per frame are bounded across large pointer jumps.
Composed Work Motion still sleeps when inactive after every field disappears.

## Motion and lifecycle

Some clusters travel into and out of the viewport; others emerge inside it,
drift gently and disappear there. Each lifetime eases from no influence into a
larger shape and back to no influence. Both radius and dot density diminish, so
a disappearing metaball does not leave a detached stipple halo. Clusters begin
at staggered ages to keep the background populated on its first frame.

Reduced motion renders a still image, while prop changes and resizes can still
redraw it. Offscreen containers and hidden tabs suspend drawing. Returning to the
background resumes its own elapsed clock, without advancing by the time away.

WebGL context loss shows the static background color. A browser restoration
event rebuilds the graphics resources and resumes the same motion. Unmounting
releases the program, shaders, vertex array, buffer, observers and animation
frame. React StrictMode replay can initialize the same canvas again.

See **Effects/StippleBackground** in Storybook for every pattern, a still image,
a full-viewport wallpaper, monochrome and custom palettes, a reproducible seed,
gradient/dither comparisons, the original preset and a modified preset,
the **Work Motion** start/finish example,
custom motion, interactive overlaid content and an
unmount/remount example. Its controls update the live renderer.
