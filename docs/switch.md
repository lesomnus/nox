# Switch transitions

Keep `checked` at the confirmed value and set `pending` while applying its
opposite. The handle rests in the middle and repeat activation is blocked.
Update `checked` on success, then clear `pending`. Clear only `pending` on
failure to return to the confirmed state.

## Flutter InkSparkle port

The previous CSS ripple and SVG turbulence approximation have been removed.
The canvas runs Flutter's actual InkSparkle fragment shader, vendored unchanged
as `src/components/switch/ink-sparkle.frag` from Flutter commit
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

Nox supplies the containing rail, ink color and contact point. Pointer activation
uses the click point; keyboard/external pending uses the departure handle center.
A Switch uses white or black ink at 0.5 alpha, with the opaque handle drawn above
it. While pending, the original one-shot animation repeats with new random seeds;
its duration is not stretched. These repetitions are the pending adapter, not
part of Flutter's one-shot ink feature.

Reduced motion draws a static sample at 30% progress. Hidden documents pause the
animation. Resize/DPR changes are reflected in the raster size. WebGL context
restoration recreates resources, and unmount releases them. If WebGL2 is
unavailable, pending remains accessible and functional without an animated effect.

See **Effects/InkSparkle/Original** for the original effect on a larger surface
with Flutter's constant test seed 1337, **DarkInk** for black ink with white
sparkles, and **Components/Switch/PendingTransitions** for the rail integration.
