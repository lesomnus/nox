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

See **Components/PinInput** for numeric, four-by-four device code, grouped OTP,
masked, disabled, read-only, invalid and native-form examples.
