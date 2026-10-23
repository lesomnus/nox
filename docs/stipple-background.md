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
interactive overlaid content and
an unmount/remount example. Its controls update the live renderer.
