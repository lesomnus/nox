# Animated text

`AnimatedText` animates only characters that change, with `motion="slide"` or
the split-flap `motion="flip"`. `direction="auto"` moves increasing values down
and decreasing values up; `"up"` / `"down"` fix the physical direction. Supply
`comparisonValue` when formatted text wraps (for example, total seconds rather
than the visible seconds field). `duration` controls milliseconds. Rapid changes
replace the active transition rather than queuing old values, and the accessible
name always contains the current value. Reduced-motion preferences disable the
transitions.

## Text and one-way flaps

Text uses the same component as numbers. For an airport-style board that never
reverses its physical flip direction, use `direction="down"` (or `"up"` for a
fixed upward flap). This overrides automatic ordering, including decreasing
numbers and alphabetic wraparound.

```tsx
<AnimatedText value={status} motion="slide" />
<AnimatedText value={destination} motion="flip" direction="down" />
```

## Distance-dependent flips

Set `maxFlipSteps` to show intermediate cards. It caps the **total flips per
changed character, including the final landing**, and defaults to 1 for the
existing direct transition. Each character's flips share the existing total
`duration`. The default cadence accelerates through the middle of the path and
decelerates as it reaches the target: early and final flips take longer than the
middle ones. More distant targets allow more fast intermediate flips within the
same time budget. No initial-mount animation is added.

```tsx
<AnimatedText
  value={destination}
  motion="flip"
  direction="down"
  duration={900}
  maxFlipSteps={6}
/>
```

`flipEasing="ease-in-out"` is the default. It changes both the start schedule and
the actual duration of each card's flip along a smooth sine progress curve;
there are no extra pauses between cards. Three or more flips make the speed
change visible. A single flip keeps the full duration. Use `flipEasing="linear"`
to give every card the same amount of time instead. This cadence option also
works with fixed upward direction, custom alphabets and character start delays,
and DateTime / ElapsedTime forward it. It does not change slide motion.

Storybook **FlipAcceleration** and **FlipLinear** compare the two cadences. The
existing **FlipThrough** / **DepartureBoard** examples now use acceleration and
deceleration by default.

Default character rings are `0–9`, `A–Z` and `a–z`, separately. Down moves forward,
up moves backward, wrapping at the end of the ring. With down and a cap of 6:
`A → D` visits `B, C, D`, `Z → A` makes one forward flip, and `A → Z` samples six
cards along the forward path. Long distances skip evenly spaced cards to respect
the limit; the last card is always the requested character. Limits below 1 or
non-finite limits fall back to one flip; fractions are rounded down.

For another alphabet or a mixed sequence, pass `flipCharacters`. Unicode code
points are supported, duplicate entries are ignored, and characters absent from
the ring use a direct flip. Unlisted punctuation remains static. Added or removed
positions update immediately, as before.

```tsx
<AnimatedText
  value={text}
  motion="flip"
  direction="down"
  maxFlipSteps={5}
  flipCharacters="가나다라마바사아자차카타파하"
/>
```

Intermediate cards are visual only: the accessible name immediately contains the
requested value. A new value replaces the previous sequence and cancels its
timers. Reduced-motion preferences and `duration={0}` skip all intermediate
cards. Slide and none motion ignore the flip options.

## Character start timing

`characterDelay` controls when each changed character starts, for both slide and
flip. A number is the interval in milliseconds **between changed, animated
characters**, left to right. Unchanged characters and static punctuation do not
leave gaps in the stagger. It defaults to 0 (all start together).

```tsx
<AnimatedText value={status} motion="slide" characterDelay={80} />
<AnimatedText value={destination} motion="flip" direction="down"
  maxFlipSteps={6} duration={900} characterDelay={100} />
```

A callback returns each character's absolute start delay in milliseconds:

```tsx
// Right to left among changed characters.
characterDelay={({ changedIndex, changedCount }) =>
  (changedCount - 1 - changedIndex) * 80}

// Center out, using positions in the whole new text.
characterDelay={({ index, length }) => Math.abs(index - (length - 1) / 2) * 100}

// Fresh irregular timing on each value update.
characterDelay={() => Math.random() * 400}
```

The callback receives `character`, `previousCharacter`, `index`, `length`,
`changedIndex`, `changedCount`, `text` and `previousText`. Positions count Unicode
code points. `TextCharacterDelay` and `TextCharacterDelayContext` are exported
types. Only changed characters that can animate invoke the callback; new or
removed positions update immediately as before.

Delays are evaluated once per value transition. Inline callbacks are supported:
an unrelated render or changing the timing control does not restart an active
transition or reroll random delays; the next value uses the latest callback.
Negative and non-finite results become 0.

Before its start, each character still shows its previous value. `duration`
continues to mean the duration of **one character's whole transition**, including
its intermediate flips. The full text finishes after `duration + largest delay`.
Only the first flip is delayed; its following flips run consecutively. The
accessible name immediately reflects the target value. New values cancel both
waiting and running work; reduced motion, none motion and zero duration skip
delays altogether.

DateTime and ElapsedTime accept `characterDelay` too. Storybook **StaggeredSlide**,
**StaggeredFlip**, **CenterOutSlide**, **RandomFlip** and **CustomTiming** show
sequential, positional and callback-driven timing. The latter lets you change a
delay multiplier; the changed timing applies on the next text update.

```tsx
<AnimatedText value={price.toFixed(2)} motion="slide" />
<DateTime value={now} motion="flip" />
<ElapsedTime startedAt={startedAt} label="Elapsed time" motion="slide" direction="up" />
```

DateTime and ElapsedTime accept the same motion, direction, duration and flip options;
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
TextSlide, TextFlip, FlipForwardOnly, FlipThrough, DepartureBoard and KoreanText
demonstrate text labels, one-way flaps, bounded sequences and custom alphabets.
DateTime and ElapsedTime also have their own Sliding and Flipping stories.
Browser checks cover interruption, direction, timestamp semantics and reduced
motion; package checks cover compiled and TSX source consumers.
