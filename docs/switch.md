# Switch transitions

Keep `checked` at the confirmed value and set `pending` while applying its
opposite. The handle rests in the middle and repeat activation is blocked.
Update `checked` on success, then clear `pending`. Clear only `pending` on
failure to return to the confirmed state.

Switch composes the standalone [InkSparkle effect](ink-sparkle.md), repeating a
burst every **2000ms**, slower than the effect's native 617ms duration. Its center
is fixed **8px outside** the departure edge: `[-8, 11]` when turning on and
`[48, 11]` when turning off in the 40×22px rail. The center stays outside rather
than migrating into the slot. Click position does not change the center.

The rail clips the effect, and the opaque handle stays above it. Ink is white
at 0.2 alpha when turning on and black at 0.5 alpha when turning off. Flutter's white
sparkles are retained in both cases. Reduced motion shows a static sample.
Without WebGL2, the pending state remains accessible and functional.

See **Components/Switch/PendingTransitions** to compare both directions and
**AsyncTransition** for the controlled pending lifecycle. Use the public
`InkSparkle` component directly to choose duration, origin, center motion and
single-burst or looping playback elsewhere.
