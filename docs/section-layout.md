# SectionLayout

Compose a bounded column of independent entries, each containing related surfaces.
The layout separates entries with generous space while keeping an entry's sections
close together. Section surfaces have no border or shadow.

```tsx
<SectionLayout>
  <article aria-label="Workspace">
    <SectionGroup>
      <Section aria-label="Information">Information fields</Section>
      <Section aria-label="Connection">Connection controls</Section>
      <Section aria-label="Activity">Activity content</Section>
    </SectionGroup>
  </article>
</SectionLayout>
```

- `SectionLayout` supplies the column width, alignment and spacing between entries.
  `align` is `center` by default or `start`. `maxWidth` accepts a CSS max-width value
  or a number in pixels, including `none` for an unbounded column.
- `SectionGroup` groups direct `Section` children with compact gaps. The first and
  last sections keep rounded outer corners, while facing corners stay small.
  A single section keeps every outer corner. Conditional sections update this
  silhouette through CSS, without child counting or extra React state.
- `Section` renders a native section with the shared background, padding and content
  gap. Outside a group it retains its complete rounded outline. Composed components
  may return a Section directly; put ungrouped headers or actions outside the group.

All three forward native attributes, events, refs, className and style. Use native
articles and accessible names to describe entries. Content typography, field layout,
forms, data loading and business actions belong to the host; no resource schemas or
API clients are required.

Visual defaults live in `src/theme/tokens.css` under `--ui-section-*`. Override these
tokens on a layout to adapt the shared widths, spacing, padding, colors and corner
radii. The components inherit them without app-specific CSS selectors.

Storybook **Layout/SectionLayout** includes grouped records, independent surfaces,
start alignment, full width and conditional sections.
