# InkSparkle

`InkSparkle` is a standalone decorative canvas effect, exported from
`@lesomnus/nox`. It has no Switch dependency. Size its parent and position it
as an overlay when needed; pointer events pass through to the content below.
Mount it to start a burst, and remount it to replay. Changing animation settings
restarts the effect. By default it plays once using Flutter's 617ms duration.

```tsx
import { InkSparkle, type InkSparkleProps } from "@lesomnus/nox";

<div
  style={{
    position: "relative",
    height: 160,
    overflow: "hidden",
    borderRadius: 12,
  }}
>
  <InkSparkle
    color={[0.4, 0.65, 1, 0.24]}
    duration={2000}
    origin={[-16, 80]}
    centerMotion="fixed"
    loop
    style={{ position: "absolute", inset: 0 }}
  />
  <div style={{ position: "relative" }}>Content above the effect</div>
</div>;
```

| Prop                 | Default           | Meaning                                                                                                                                |
| -------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `duration`           | `617`             | Milliseconds per burst; a larger value slows the entire animation. Non-finite/non-positive values use 617ms.                           |
| `origin`             | Canvas center     | `[x, y]` in local CSS pixels. Negative or off-surface coordinates are supported.                                                       |
| `centerMotion`       | `"to-center"`     | Flutter's original center migration, or `"fixed"` to expand around `origin`.                                                           |
| `color`              | `[1, 1, 1, 0.24]` | Normalized RGBA ink color. Sparkles remain white, including with black ink.                                                            |
| `loop`               | `false`           | Repeat until unmounted; omitted for a single burst.                                                                                    |
| `pressed`            | —                 | Controlled press lifecycle: true expands and holds the ink; false freezes the current frame and fades it out. Overrides loop playback. |
| `onComplete`         | —                 | Called once after a non-looping burst. Useful for removing an overlay.                                                                 |
| `seed`               | Random            | Stable turbulence/noise seed; 1337 matches Flutter's test factory.                                                                     |
| `className`, `style` | —                 | Canvas sizing and placement. The canvas fills its parent by default.                                                                   |

All animation channels share the chosen duration; radius, turbulence, center,
ink opacity and sparkle opacity keep their original relative timing. The shader
itself remains unchanged. A loop chooses a new random seed per burst unless
`seed` is supplied. In fixed mode only the center migration is disabled.

Reduced motion draws a static sample at 30% progress and completes a one-shot
immediately. Hidden documents pause the animation; visible playback restarts the
burst. Resize/DPR changes update the raster size. WebGL context restoration
recreates resources, and unmount releases them. If WebGL2 is unavailable, the
effect remains transparent and a non-looping effect completes immediately.

See **Effects/InkSparkle/Original**, **Slow**, **OutsideCenter**,
**SpeedComparison**, **SingleBurst**, **ButtonClick**, and **ButtonTone** for public-import examples.
ButtonClick composes the shared Button with a clipped, non-interactive overlay:
pointer down uses local coordinates; Enter/Space down uses the center. The ink
expands and holds until release, cancellation or blur, then fades back to the
original button color. Expanded ink stops requesting frames, and release does
not recreate the renderer. Reduced motion uses a static held sample and removes
it immediately on release. Completed overlays unmount; rapid presses can overlap
within a bounded limit. Omit `pressed` to retain the original one-shot/loop behavior.
ButtonTone reuses that interaction with a subtle neutral highlight close to the
button's native pressed background; ButtonClick keeps the customizable blue ink.
Both button examples suppress the native pressed background change so only the
ink spreads on press. Hover styling and the label's press animation stay active.

## Flutter InkSparkle port

The previous CSS ripple and SVG turbulence approximation have been removed.
The canvas runs Flutter's actual InkSparkle fragment shader, vendored unchanged
as `src/components/ink-sparkle/ink-sparkle.frag` from Flutter commit
`457d49bc600142ecb927f382cf20a728af186ea7`.

Sources:

- [Shader](https://github.com/flutter/flutter/blob/457d49bc600142ecb927f382cf20a728af186ea7/packages/flutter/lib/src/material/shaders/ink_sparkle.frag).
- [Animation and uniforms](https://github.com/flutter/flutter/blob/457d49bc600142ecb927f382cf20a728af186ea7/packages/flutter/lib/src/material/ink_sparkle.dart).
- [Flutter BSD license](flutter-LICENSE.txt), retained for source and binary distribution.

The WebGL2 adapter changes only the shader version, Flutter coordinate bindings,
uniform declarations and uniform aliases. It retains the original soft circle
and ring, triangular-noise sparkles, three rotating circle grids, turbulence
formula and premultiplied color composition. Sparkles are always white, including
on black ink, exactly as in Flutter.

The TypeScript animation ports the original 617ms duration, fastOutSlowIn radius
curve and final hold, contact-to-center migration, separate normalized alpha and
sparkle-alpha timelines, target-radius multiplier 2.3, noise density 2.1 and all
circle/rotation uniforms. This replaces the previously fixed-origin animation.
