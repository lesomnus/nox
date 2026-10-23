# Switch transitions

Keep `checked` at the confirmed value and set `pending` while applying its
opposite. The handle rests in the middle and repeat activation is blocked.
Update `checked` on success, then clear `pending`. Clear only `pending` on
failure to return to the confirmed state.

The pending ripple grows in place from the departure edge of the rail. Turning
on uses light; turning off uses a stronger dark wave. The handle stays opaque
above the effect. Reduced motion shows a static textured wave.

The texture takes inspiration from Flutter Material 3's
[InkSparkle shader](https://github.com/flutter/flutter/blob/main/packages/flutter/lib/src/material/shaders/ink_sparkle.frag),
which combines a soft wave and ring with turbulence-modulated noise. This is a
web adaptation, not a shader port: SVG fractal noise supplies broad density
variation and finer grain, and a small displacement softens the uniform contour.
The noise changes opacity rather than adding white sparkles, so the same texture
also works for the dark transition. Each pending instance has a stable, unique
filter ID and deterministic noise seed. The filter is mounted only while pending;
the ripple uses CSS animation without a JavaScript animation loop.

See **Components/Switch/PendingTransitions** to compare both directions and
**AsyncTransition** for the controlled pending lifecycle.
