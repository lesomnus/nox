# Animated text

`AnimatedText` animates only characters that change, with `motion="slide"` or
the split-flap `motion="flip"`. `direction="auto"` moves increasing values down
and decreasing values up; `"up"` / `"down"` fix the physical direction. Supply
`comparisonValue` when formatted text wraps (for example, total seconds rather
than the visible seconds field). `duration` controls milliseconds. Rapid changes
replace the active transition rather than queuing old values, and the accessible
name always contains the current value. Reduced-motion preferences disable the
transitions.

```tsx
<AnimatedText value={price.toFixed(2)} motion="slide" />
<DateTime value={now} motion="flip" />
<ElapsedTime startedAt={startedAt} label="Elapsed time" motion="slide" direction="up" />
```

DateTime and ElapsedTime accept the same motion, direction and duration options;
their default is `motion="none"`. DateTime is controlled by its host, while
ElapsedTime keeps its existing one-second clock. Neither adds a second clock to
AnimatedText. The `characterClassName` callback styles individual characters;
the time components use it to preserve value, separator and leading color roles.
Flap surfaces use `--ui-text-flip-background` / `--ui-text-flip-divider`, and
slides use `--ui-text-motion-easing`.

## Time components

Only changed characters animate; separators keep their color and position.
DateTime uses the underlying timestamp for direction, and ElapsedTime uses total
seconds. A minute, hour, date or timezone-offset rollover therefore does not
reverse individual digits unexpectedly. Missing and invalid DateTime states
retain their static dot/x placeholders. Initial mounts do not animate.

```tsx
import { AnimatedText, DateTime, ElapsedTime } from "@lesomnus/nox";
import "@lesomnus/nox/styles.css";

<DateTime value={now} motion="slide" direction="down" duration={300} />
<ElapsedTime startedAt={start} label="Elapsed" motion="flip" duration={500} />
```

AnimatedText defaults to slide motion. Time components default to none so existing
layouts opt into animation explicitly. Use the same shared text color tokens for
custom displays via `characterClassName`. Duration zero also updates instantly.
For the same value and font, flip uses the static text's dimensions without extra
padding, margins or minimum character widths.

## Examples and validation

Storybook **Components/AnimatedText** has increase/decrease controls, fixed up and
down slides, split flaps, live clocks and a midnight/minute rollover example.
DateTime and ElapsedTime also have their own Sliding and Flipping stories.
Browser checks cover interruption, direction, timestamp semantics and reduced
motion; package checks cover compiled and TSX source consumers.
