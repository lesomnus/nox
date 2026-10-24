# Skeleton

`Skeleton` is a decorative loading placeholder. Import it from `@lesomnus/nox`.

```tsx
<section aria-busy="true" aria-label="Profile">
  <span role="status">Loading profile…</span>
  <SkeletonGroup>
    <Skeleton variant="circle" width={40} />
    <Skeleton width="60%" />
    <Skeleton variant="rect" height={100} />
  </SkeletonGroup>
</section>
```

It renders a noninteractive `span` with `aria-hidden="true"`. Announce loading
once on the containing region rather than on every placeholder. Skeletons do
not accept children. Native attributes, refs, class and style are supported.

- `variant`: `text` (default, 100% width and 1em height), `rect` (100% width,
  40px height), or `circle` (32px diameter).
- `width` and `height`: CSS lengths or numeric pixel values. For a circle,
  set width to change its diameter; aspect ratio preserves the shape.
- `animated`: defaults to true. Set false for a static placeholder. The shimmer
  stops continuous animation with `prefers-reduced-motion`, showing one static
  InkSparkle frame.

The effect uses `InkSparkle` rather than a CSS shimmer. Override
`--ui-skeleton-background`, `--ui-skeleton-ink-color`, `--ui-skeleton-highlight`,
`--ui-skeleton-radius` or `--ui-skeleton-duration` (1600ms) on an instance or
ancestor. Colors follow the dark/light theme. `sparkleOptions` accepts the same
normalized RGBA `color`/`sparkleColor`, millisecond `duration` and `seed` as
InkSparkle, overriding these defaults.

## A continuous group

```tsx
import { Skeleton, SkeletonGroup } from "@lesomnus/nox";

<SkeletonGroup
  style={{ display: "flex", gap: 16 }}
  sparkleOptions={{ duration: 2400 }}
>
  <Skeleton variant="rect" width={160} height={80} />
  <Skeleton variant="rect" width={160} height={80} />
</SkeletonGroup>;
```

`SkeletonGroup` renders a relative `div` and accepts native div props and ref.
It does not choose a layout; use normal flex, grid or block styles. Descendant
Skeletons share **one canvas and one animation clock**. An InkSparkle wave
expands from just outside the group's left edge and passes through the whole
surface. Rounded SVG masks expose it only inside the placeholders, so it
crosses A, disappears in the gap, and continues into B instead of restarting
inside each box. The effect never changes placeholder dimensions.

Registration follows the nearest group, including across ordinary nested
wrappers. Shapes and masks update on membership, resize, layout changes and
scrolling. Late additions join the existing wave. Groups have independent
surfaces; nested groups own their own members. A standalone Skeleton uses its
own InkSparkle surface.

Set `SkeletonGroup.animated={false}` to disable the entire group's effect.
Individual `Skeleton.animated={false}` placeholders are excluded from its mask.
The group owns duration and colors through its `sparkleOptions` or CSS tokens;
individual `sparkleOptions` apply to standalone Skeletons. InkSparkle respects
reduced motion and document visibility. If WebGL2 is unavailable, the base
placeholders remain visible.

See **Components/Skeleton → Grouped** for A→B continuity, **SeparateGroups** for
independent surfaces and **DynamicGroup** for membership/resizing. Profile and
**Components/Table → Loading** also use one shared group.
