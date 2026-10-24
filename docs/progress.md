# Progress

`Progress` displays a filled rail inside a box. Its appearance is part of the
component's own CSS; consumers do not need application styles or a provider.

```tsx
import { Progress } from "@lesomnus/nox";

<Progress
  aria-label="Download progress"
  value={downloadedBytes}
  max={totalBytes}
  variant="bordered"
  animated={working}
/>;
```

`value` is required; `max` defaults to 100. Values are clamped to 0–max, a
non-finite value becomes zero, and a non-positive/non-finite max falls back to 100. The component exposes these normalized numbers through `role="progressbar"`
and `aria-valuemin`, `aria-valuemax`, `aria-valuenow`. Provide `aria-label` or
`aria-labelledby`; `aria-valuetext` can describe units or other context. The
caller owns progress updates, polling and completion behavior.

`animated` defaults to true. It enables fill-width transitions and loops the
existing `InkSparkle` effect, clipped inside the fill. Dark ink and sparkles give
contrast against the solid bar. Its center stays fixed two
bar heights outside the left edge, vertically centered on the bar. Resizing or
changing the bar height keeps that origin outside the bar. `sparkleOptions`
customizes `color`, `sparkleColor`, `duration` and `seed`; the default burst takes
2000ms. The origin, fixed-center motion and looping remain owned by Progress.

Colors are configurable React props, independent of the bar's CSS color.
`color` controls the ink and `sparkleColor` the sparkling pixels. Both accept
normalized `[red, green, blue, alpha]` channels from 0 to 1; alpha controls
opacity/strength. Defaults are black ink at 0.4 opacity and black sparkles at
full strength. For a dark bar, use lighter ink instead:

```tsx
<Progress
  className="dark-progress"
  aria-label="Upload progress"
  value={65}
  sparkleOptions={{
    color: [1, 1, 1, 0.3],
    sparkleColor: [1, 1, 1, 0.8],
  }}
/>
```

```css
.dark-progress {
  --ui-progress-fill-color: #27364a;
}
```

Set `animated={false}` to remove the decorative canvas and width transitions.
Zero progress does not allocate a canvas. Reduced motion removes width
transitions and uses InkSparkle's static sample. If WebGL2 is unavailable, the
solid fill and progress semantics remain usable.

The default variant has a background box and comfortable padding.
`variant="bordered"` adds a one-pixel border and uses the shared
`--ui-control-inset` for a narrow gap. Outer corner radii are derived from the
rail radius, padding and border thickness, keeping them concentric.

Optional CSS overrides:

| Token                               | Default                                                        |
| ----------------------------------- | -------------------------------------------------------------- |
| `--ui-progress-padding`             | `--ui-control-inline-inset`; `--ui-control-inset` for bordered |
| `--ui-progress-bar-height`          | `8px`                                                          |
| `--ui-progress-bar-radius`          | `--ui-control-inset`                                           |
| `--ui-progress-background`          | `--ui-shade-24`                                                |
| `--ui-progress-rail-color`          | `--ui-shade-43`                                                |
| `--ui-progress-fill-color`          | `--ui-shade-160`                                               |
| `--ui-progress-border-color`        | `--ui-shade-60`                                                |
| `--ui-progress-transition-duration` | `180ms`                                                        |

See **Components/Progress/Default**, **Static**, **Bordered**, **Custom Colors**, **Interactive**
and **States**. Interactive exposes the value slider and animation switch;
Storybook Controls also expose the public props on every example.
