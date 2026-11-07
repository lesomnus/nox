# ActivityDots

A decorative indicator with a braille-like dot arrangement. Each dot grows, changes from a highlight to the text color and shrinks. `seed` fixes phase and palette assignment across rerenders and reloads. Derive a seed from the identity and run start in the host; the library has no session model.

`palette` accepts CSS colors and variables. `step` adjusts timing; reduced-motion users receive a static indicator. Add an accessible working label to the surrounding element, since the SVG is decorative by default. `activityPattern` exposes the deterministic pattern for other renderers.
