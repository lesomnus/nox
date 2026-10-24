# DatePicker

DatePicker selects a single Gregorian calendar date. It works without an app
provider, router, backend or date-library dependency. DateTime remains the
component for displaying timestamps; DatePicker exchanges civil dates, not
instants or time zones.

```tsx
import { useState } from "react";
import { DatePicker } from "@lesomnus/nox";
import "@lesomnus/nox/styles.css";

function Example() {
  const [date, setDate] = useState<string | null>(null);
  return (
    <DatePicker
      label="Due date"
      value={date}
      onChange={setDate}
      name="due_date"
      min="2026-01-01"
      max="2026-12-31"
    />
  );
}
```

Values, defaultValue, min and max use `YYYY-MM-DD`. An empty selection is `null`;
its form value is an empty string. Invalid date strings are treated as absent.
Use `defaultValue` instead of `value` for internal state. A native form reset
restores the uncontrolled default and closes the calendar without calling
onChange. Controlled values stay owned by the caller. `name` and `form` connect
the hidden value to native FormData; the ref points to the trigger button.
Selection and clearing call onChange only when the value changes. Browser
required-field validation is not added to the hidden value; applications own
required-field and business validation.

`min` and `max` are inclusive. `isDateDisabled(date)` can reject additional days.
Unavailable days remain focusable with calendar arrow keys and announce their
unavailable state, but cannot be selected by mouse or keyboard. Navigation
respects the bounds. Use `clearable={false}` to omit Clear date. `readOnly`
retains a focusable value without opening the calendar; `disabled` also removes
the trigger from tab navigation and omits the form value.

`locale` controls date, month, weekday and number formatting. `weekStartsOn`
chooses the first weekday, starting with Sunday. Calendar arithmetic stays
Gregorian and date-only in every locale. Today uses the user's local civil date.
Built-in action labels use the optional UIProvider translation function.

Opening focuses the selected date, or Today clamped to the bounds. Keyboard use:

- Enter, Space or an up/down arrow opens the trigger.
- Left/right arrows move by day; up/down arrows move by week.
- Home/End moves to the start/end of the displayed week.
- Page Up/Down moves by month; holding Shift moves by year.
- Enter/Space selects the focused available date.
- Tab visits month navigation, the roving day and footer actions. Leaving the
  popup closes it and continues from the trigger in the host's tab order.
- Escape dismisses without changing the value and returns focus to the trigger.
  An outside pointer press dismisses without stealing the new target's focus.

The popup uses MenuSurface for appearance and portal placement, including inside
an open native dialog, and ScrollArea when a short viewport needs scrolling.
The calendar reserves its week rows so month changes do not resize the surface.
Its CSS Module owns layout; `--ui-date-picker-*`, shared spacing, menu and motion
tokens in `src/theme/tokens.css` are the source of truth for dimensions and style.

Storybook **Components/DatePicker** includes default, empty, restricted,
localized, disabled/read-only, controlled, native form, inside-dialog,
viewport-edge and fully unavailable examples.
