# Skeleton

`Skeleton` is a decorative loading placeholder. Import it from `@lesomnus/nox`.

```tsx
<section aria-busy="true" aria-label="Profile">
  <span role="status">Loading profile…</span>
  <Skeleton variant="circle" width={40} />
  <Skeleton width="60%" />
  <Skeleton variant="rect" height={100} />
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
  also stops automatically with `prefers-reduced-motion`.

The shimmer uses a pseudo element and does not change layout dimensions.
Override `--ui-skeleton-background`, `--ui-skeleton-highlight`,
`--ui-skeleton-radius` or `--ui-skeleton-duration` (1600ms) on any instance or
ancestor. Colors follow the dark/light theme.

See **Components/Skeleton** for shapes, static mode and a profile composition;
**Components/Table → Loading** demonstrates placeholders matching table columns.
