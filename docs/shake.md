# Independent shake feedback

`useShake` animates existing elements without adding a wrapper. Each activation
assigns every target a predefined damped path, an independent amplitude, direction,
duration and start delay. The browser interpolates the keyframes; JavaScript does
not update positions every frame. The paths themselves live in `SHAKE_PRESETS`.

```tsx
import { useRef } from "react";
import { Button, useShake } from "@lesomnus/nox";

function ShakeItems() {
  const targets = useRef<HTMLDivElement>(null);
  const { shake } = useShake();
  return (
    <>
      <div ref={targets}>
        <div data-item>First</div>
        <div data-item>Second</div>
      </div>
      <Button
        onClick={() =>
          shake(targets.current?.querySelectorAll("[data-item]") ?? null)
        }
      >
        Shake items
      </Button>
    </>
  );
}
```

Pass a single Element or an iterable of elements. `distance`, `duration` and
`maxDelay` customize the nominal displacement, duration and randomized start-delay
limit. `presets` restricts the pool or supplies custom normalized paths. Exported
`ShakePreset` and `ShakePoint` describe named paths whose first and last points
should be at rest. All built-in paths settle back to their initial position.

Motion uses additive transforms so existing transforms remain intact. Replaying
cancels the previous run; `cancel()` stops it explicitly. Unmounting also cancels
all targets. There are no persistent inline transform styles after completion.
Reduced-motion preferences suppress the effect and cancel it if enabled mid-run.

## Applying it to PinInput

PinInput already uses this effect on its individual visual slots. The native input
stays still, retaining focus, selection, value and autofill behavior.

```tsx
<PinInput
  label="Verification code"
  value={code}
  onChange={setCode}
  aria-invalid={Boolean(error)}
  aria-busy={pending}
/>
```

Every slot keeps its red error border during hover and focus. A new invalid state
plays one short independent shake per slot. Finishing an `aria-busy` verification
while still invalid also replays it; typing and focus updates do not. The caller
owns verification and resetting the error state. Clearing the error stops motion
and restores normal borders without clearing the entered code.

Use `errorShake={false}` to disable only the motion, or pass a `ShakeOptions`
object through `errorShake` to customize it. Reduced motion still takes priority.
When composing an ActionError, set `highlightTrigger={false}`: the field's slots
own its visual error state, rather than the transparent native input overlay.

See **Components/PinInput/Invalid** for the component state and
**Patterns/HandlerFailures/CodeComplete** for a failed request that preserves its
code. **Effects/Shake/Default** demonstrates the same effect independently, with
Controls for targets, presets and timing.
