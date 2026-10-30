# PIN and device-code input

`PinInput` is exported from `@lesomnus/nox`. It presents a single native text
input as character slots, so screen readers encounter one labeled field and
keyboard users have one tab stop. Leading zeroes remain part of the string.

```tsx
import { useState } from "react";
import { PinInput } from "@lesomnus/nox";

function DeviceCode() {
  const [code, setCode] = useState("");
  return (
    <PinInput
      label="Device code"
      groups={[4, 4]}
      mode="alphanumeric"
      value={code}
      onChange={setCode}
      name="device_code"
      required
    />
  );
}
```

Use `length={4}` or `length={6}` for numeric PINs and verification codes.
`groups={[4, 4]}` displays two groups of four with a visual separator; group
sizes determine the total slot count and take precedence over `length`.
`groups={[3, 3]}` provides another common grouping. All counts must be positive
integers. Use `separator` to replace the visual dash or omit it with `null`.
Separators never enter `value` or native form submission.

| Prop                 | Default     | Meaning                                                                                          |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `label`              | Required    | Accessible field name. A visible `<label htmlFor>` can use the input's `id`.                     |
| `length`             | `6`         | Number of slots when groups are omitted.                                                         |
| `groups`             | —           | Slot counts per group. Their sum is the total length.                                            |
| `mode`               | `"numeric"` | Digits only, or `"alphanumeric"` for uppercase Latin letters and digits.                         |
| `value`, `onChange`  | —           | Controlled string value and normalized value callback.                                           |
| `defaultValue`       | `""`        | Initial value for uncontrolled use. Native form reset restores it.                               |
| `onComplete`         | —           | Called after a user edit produces a changed full-length code. Does not submit or blur the field. |
| `masked`             | `false`     | Native password input and visual bullet slots.                                                   |
| `separator`          | `"–"`       | Decorative group separator.                                                                      |
| `className`, `style` | —           | Root appearance and token overrides.                                                             |
| `ref`                | —           | Native input ref for focus, selection and form validity.                                         |

Native attributes such as `id`, `name`, `form`, `required`, `disabled`,
`readOnly`, `autoFocus`, `aria-invalid` and `aria-describedby` are forwarded to
the input. The component owns the text/password type and full-code validation
pattern. `autoComplete` defaults to `one-time-code`; `inputMode` defaults to
`numeric` or `text` according to the mode. The caller owns error text,
verification requests and any completion-driven navigation.

`aria-invalid` colors every slot's border, including while hovered or focused.
By default, becoming invalid triggers an independent randomized shake per slot;
an `aria-busy` request that finishes while still invalid replays it. Set
`errorShake={false}` to disable motion or pass shared `ShakeOptions` to customize
it. The native input remains stationary and reduced-motion preferences are
respected. See [the reusable Shake effect guide](./shake.md) for composition and
request-failure examples.

## Verify automatically when complete

**Components/PinInput/Verification** is a runnable usage recipe. Its simulated
request fails once and then succeeds, so the same example exercises both paths.
It shares its implementation with **Patterns/HandlerFailures/CodeComplete**.

| State           | Input                      | Slot borders                       | Next step                                |
| --------------- | -------------------------- | ---------------------------------- | ---------------------------------------- |
| Editing         | Enabled                    | Normal                             | Completing the code starts verification. |
| Request pending | Disabled and `aria-busy`   | Normal, dimmed by disabled styling | Await the request.                       |
| Success         | Enabled                    | Green                              | Editing clears the result.               |
| Failure         | Enabled and `aria-invalid` | Red, with independent slot shake   | Edit and complete again to retry.        |

Keep verification in the caller. Use `onChange` for the draft and clearing old
feedback; use `onComplete` to start the request. `useAsyncAction` catches rejected
requests, guards duplicate calls and owns pending/error state. Apply success
feedback only when its `run` resolves to true. Do not clear the code on failure.

```tsx
import { useEffect, useId, useRef, useState } from "react";
import { ActionError, PinInput, useAsyncAction } from "@lesomnus/nox";
import styles from "./verification-code.module.css";

function VerificationCode({
  verifyCode,
}: {
  verifyCode: (code: string) => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const requested = useRef("");
  const errorId = useId();
  const verification = useAsyncAction(async (next: string) => {
    requested.current = next;
    await verifyCode(next);
  });
  const complete = async (next: string) => {
    if (await verification.run(next)) setVerified(true);
  };

  useEffect(() => {
    // Disabling a focused native input can leave focus on the document body.
    // Restore it after the request, without taking it from another control.
    if (
      !verification.pending &&
      requested.current &&
      document.activeElement === document.body
    )
      input.current?.focus({ preventScroll: true });
  }, [verification.pending]);

  return (
    <>
      <PinInput
        ref={input}
        label="Verification code"
        length={6}
        value={code}
        disabled={verification.pending}
        aria-busy={verification.pending}
        aria-invalid={Boolean(verification.error)}
        aria-describedby={verification.error ? errorId : undefined}
        className={verified ? styles.verifiedCode : undefined}
        onChange={(next) => {
          setCode(next);
          setVerified(false);
          verification.reset();
        }}
        onComplete={(next) => void complete(next)}
      />
      {verification.error && (
        <ActionError
          id={errorId}
          anchor={input.current}
          highlightTrigger={false}
          onDismiss={verification.reset}
        >
          {verification.error.message}
        </ActionError>
      )}
      <output role="status" className={styles.verificationStatus}>
        {verification.pending
          ? "Verifying code…"
          : verified
            ? "Code verified"
            : verification.error
              ? "Verification failed"
              : "Enter a complete code"}
      </output>
    </>
  );
}
```

```css
/* verification-code.module.css */
.verifiedCode {
  --ui-pin-input-border-color: var(--ui-pin-input-success-color);
}
.verificationStatus {
  min-block-size: 1lh;
}
```

The border override also applies during hover and focus; invalid styling takes
precedence. Removing the success class restores the ordinary interactive colors.
The success color has dark/light theme defaults and can be overridden by the app.
An always-present status line reserves space; ActionError overlays its trigger
without moving the layout. `highlightTrigger={false}` leaves error decoration
to the slots. Dismissing that error also clears its invalid feedback.

A request ending in failure automatically triggers the existing Invalid effect,
including reduced-motion support. Re-enabling and focusing the input selects the
last filled slot for correction. A changed full-length code immediately starts
another request; deleting to a partial code just returns to normal editing.
Refocusing or pasting the unchanged complete code does not submit again.

Use `disabled`, rather than only `readOnly`, when the field must be unavailable
during verification. A disabled native field is omitted from FormData: capture
the complete code from `onComplete` before starting the request, as above.

## Editing

Typing advances the visible caret. Clicking or tapping a filled slot selects
its character for replacement. Empty slots beyond the current value focus the
first empty slot, so there are no gaps in the code. Arrow keys, Home and End
navigate slots; Shift selection, select-all, copy, Backspace and Delete retain
native text editing semantics. Deleting from the middle shifts later characters
left. Tab leaves the entire input rather than moving through every slot.

Pasting a complete code replaces the whole value from any slot. Partial paste
replaces the current selection and preserves the rest, up to the configured
length. Hyphens, spaces and incompatible characters are discarded. Alphanumeric
codes are uppercased. Fullwidth Latin letters/digits are normalized. Composition
is kept intact until IME commit before publishing a normalized value.

Clearing and filling again can call `onComplete` again; pasting the same complete
value does not. Initial values and external controlled updates do not call it.
Controlled form reset belongs to the parent; uncontrolled form reset restores
`defaultValue` without generating a change callback.

## Appearance

The field uses the shared monochrome tokens, monospace font and a focused-slot
outline. Grouped slots shrink within bounded narrow containers. `aria-invalid`
adds the error border, while reduced motion disables caret blinking.

Override `--ui-pin-input-slot-width`, `--ui-pin-input-slot-height`,
`--ui-pin-input-gap`, `--ui-pin-input-radius` and `--ui-pin-input-error-color`
on the root or a parent. Defaults live in `src/theme/tokens.css`.

`--ui-pin-input-border-color` overrides normal, hover and focused slot borders;
leave it unset for the default interactive colors. For verified feedback, use
`var(--ui-pin-input-success-color)` as in the recipe above. Invalid borders retain
their error color even when this override is present.

See **Components/PinInput** for numeric, four-by-four device code, grouped OTP,
masked, disabled, read-only, invalid, verification and native-form examples.
