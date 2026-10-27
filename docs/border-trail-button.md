# BorderTrailButton

A regular Nox Button with colored segments moving along its outline. Application
state, counts and labels belong to the caller. It uses the shared button's native
keyboard, focus, disabled, loading, ref and InkSparkle behavior.

```tsx
<BorderTrailButton active={jobs > 0} segments={Math.max(1, jobs)}>
  {jobs}
</BorderTrailButton>

<BorderTrailButton segments={5} colors={["#78d9ef", "#c58bef", "#d9ff30"]}>
  Working
</BorderTrailButton>
```

`segments` accepts a nonnegative count or an array of `BorderTrailSegment` settings.
The count has no built-in upper cap. Colors cycle through `colors`; an empty palette
uses the theme palette. Zero segments leaves only the quiet track.

Each segment may override its `color`, `length`, `duration` and `offset`. Length
and starting offset are fractions of the full perimeter; lengths are clamped to
the unit interval and offsets wrap around it. Duration is a positive lap time in
milliseconds. Shared `segmentLength` and `duration` provide fallbacks. Without a
length override, trails shorten as the count grows to leave space between them.
Omitted offsets distribute segments evenly around the outline.

`active={false}` fades and pauses the segments while preserving the track and
layout. Reduced motion keeps the colors at their starting positions. Supply a visible
label or `aria-label`; the animated SVG is decorative and cannot intercept input.

The outline follows the button's dimensions and CSS corner radii, including pill
and asymmetric corners. The border is a sibling of the button's scaled content,
so pointer and keyboard presses shrink only the label. Its stroke thickness stays
constant; breathing varies opacity instead of moving or narrowing the outline.

Geometry, palette, intensity and motion defaults live in `src/theme/tokens.css`
under `--ui-border-trail-*`. Use normal Button variants and styles for the surface;
the component adds no application-specific sizing or hover overrides.

## Progressive colors and traveling light

`progress` replaces the `segments` configuration. Each `perSegment` units grows
one color to its near-full length, then the next color starts growing over it.
Completed colors retain their length. Length changes transition smoothly without
resizing the button. Zero leaves the quiet track. `maxLength` optionally overrides
the maximum fraction of the perimeter; the default follows the theme token.

```tsx
<BorderTrailButton
  progress={{ value: jobs, perSegment: 8 }}
  sheen={{ duration: 4000, length: 0.12, strength: 0.6 }}
>
  {jobs}
</BorderTrailButton>
```

Enable `sheen` to send a highlight from each segment's start to its end repeatedly.
The highlight is clipped to that segment and adds no surrounding glow or surface.
`duration` controls travel time in milliseconds, `length` its fraction of the
segment, `strength` its opacity, and `color` its CSS color. Omitted settings follow
the theme. Sheen and perimeter drift use CSS animations; inactive buttons pause
them, and reduced motion hides the traveling highlight while keeping static colors.

Storybook **Progressive** lets you grow and shrink counts across color boundaries;
**Sheen** isolates the light effect. Existing individual segment configuration
remains available for other visualizations.
