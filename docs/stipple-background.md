# Stipple background

`StippleBackground` is a decorative WebGL2 background adapted from the supplied
Diamond Stipple Aurora Metaballs wallpaper. Same-color pairs drift, merge and
separate, with slowly changing radii and patterned dots around their edges.
It uses the browser GPU directly and adds no runtime dependency.

```tsx
import { StippleBackground } from "@lesomnus/nox";

<StippleBackground className="welcome-background" pattern="diamond">
  <Welcome />
</StippleBackground>;
```

Give the component a size through its class or content. Its canvas fills and
stays inside that container. For a wallpaper, position the component over the
viewport in the consuming application's stylesheet. The component does not style
the document or install global keyboard shortcuts. Children remain interactive
above the decorative canvas, which is hidden from assistive technology.

## Controls

- `pattern`: `bayer8`, `checker`, `diamond`, `hex`, or `fractal`.
- `speed`: simulation time multiplier. Zero keeps a still image.
- `grainPx`: grain spacing before the lattice multiplier, in CSS pixels.
- `scatterPx`: the spread of the stippled edge. Retains the supplied shader's
  square-root compression so large values produce gradual falloff.
- `merge`: blending distance for same-color blobs, in height-normalized
  coordinates. Zero keeps their distance fields separate.
- `colors`: three colors, using short or full RGB hex strings.
- `backgroundColor`: a short or full RGB hex string, also used for the fallback.
- `seed`: reproducible initial positions and motion. Changing it restarts the
  arrangement; ordinary control changes preserve the current simulation time.
- `paused`: freeze the current image; resuming continues from that point.
- `maxWidth`: cap the drawing buffer width while keeping the CSS container size.
- `maxFps`: drawing rate limit.
- `onError`: optional notification when WebGL cannot initialize or loses its
  context. The content stays available over the static background color.

Defaults live in `stipple-model.ts`. The drawing budget also respects device
pixel ratio and the GPU's render-buffer size limit. The shader and uniform buffers
are reused as props change; rendering does not update React state every frame.

## Motion and lifecycle

Reduced motion renders a still image, while prop changes and resizes can still
redraw it. Offscreen containers and hidden tabs suspend drawing. Returning to the
background resumes its own elapsed clock, without advancing by the time away.

WebGL context loss shows the static background color. A browser restoration
event rebuilds the graphics resources and resumes the same motion. Unmounting
releases the program, shaders, vertex array, buffer, observers and animation
frame. React StrictMode replay can initialize the same canvas again.

See **Effects/StippleBackground** in Storybook for every pattern, a still image,
a full-viewport wallpaper, monochrome colors, interactive overlaid content and
an unmount/remount example. Its controls update the live renderer.
