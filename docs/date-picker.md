# DatePicker

DatePicker selects Gregorian calendar dates without an app provider, router,
backend or date-library dependency. Values are civil `YYYY-MM-DD` strings;
DateTime remains the component for displaying timestamps.

## Selection modes

| mode               | value / defaultValue / onChange                    | Empty value |
| ------------------ | -------------------------------------------------- | ----------- |
| `single` (default) | `string` or `null`                                 | `null`      |
| `multiple`         | A sorted, unique array of date strings             | `[]`        |
| `range`            | `{ start: string, end: string \| null }` or `null` | `null`      |

The props form a discriminated union: the mode determines both the value shape
and the callback argument. Existing single-date consumers need no changes.
Invalid date strings are treated as absent; reversed complete ranges are ordered.

```tsx
import { useState } from "react";
import {
  DatePicker,
  dateWindowSelection,
  dateWeekSelection,
  type DatePickerDateInfo,
  type DatePickerRange,
} from "@lesomnus/nox";
import "@lesomnus/nox/styles.css";

const selectThreeDays = dateWindowSelection({ before: 1, after: 1 });
const companyCalendar: Record<string, DatePickerDateInfo> = {
  "2026-10-26": {
    disabled: true,
    label: "Company holiday",
    description: "The office is closed.",
  },
  "2026-10-30": { label: "Release day", marker: "◆" },
};

function Example() {
  const [dates, setDates] = useState<string[]>([]);
  const [period, setPeriod] = useState<DatePickerRange | null>(null);
  return (
    <>
      <DatePicker
        label="Dates"
        mode="multiple"
        value={dates}
        onChange={setDates}
        getDateInfo={(date) => companyCalendar[date]}
        getSelectionDates={selectThreeDays}
        name="dates"
      />
      <DatePicker
        label="Week"
        mode="range"
        value={period}
        onChange={setPeriod}
        weekStartsOn={1}
        getSelectionDates={dateWeekSelection}
        name="period"
      />
    </>
  );
}
```

Multiple mode toggles a day without closing. If every date in a group is already
selected, clicking it removes the whole group; otherwise it adds the missing
dates and preserves all unrelated selections. Done closes the popup.

Range mode normally commits a pending `{ start, end: null }` on the first click.
The second click commits an inclusive range in either direction; clicking the
same date twice creates a one-day range. The next click starts a new range.
Hover and keyboard focus preview the pending interval without committing it.
Escape or outside dismissal preserves a pending start; it does not undo an
onChange notification already sent. Done is disabled while a range is pending.

`closeOnSelect` defaults to closing after a complete single/range choice and
staying open for multiple mode. Set it to false to keep a completed range open,
or true to close after a multiple choice. A pending range stays open until its
end is chosen. Clear empties a selection; multiple/range mode stays open unless
closeOnSelect is explicitly true. `clearable={false}` omits Clear.

## Date information

`getDateInfo(date)` returns a `DatePickerDateInfo` object, null or undefined:

| Field                | Meaning                                                   |
| -------------------- | --------------------------------------------------------- |
| `disabled`           | Prevent selection of this date                            |
| `label`              | Holiday/event name, included in the accessible date label |
| `description`        | Additional explanation, also announced with the date      |
| `marker`             | Decorative React content below the day number             |
| `className`, `style` | Custom presentation of the day button                     |

A label supplies a small dot when marker is omitted. Use marker=null to hide it.
The name and description also appear in a reserved information area on hover or
focus, so changing content does not resize the calendar. Decorative markers are
hidden from assistive technology; label/description provide their meaning.

`min` and `max` are inclusive. `getDateInfo(date).disabled` and the existing
`isDateDisabled(date)` combine with these bounds; one rule cannot re-enable a
date rejected by another. Unavailable days remain keyboard-focusable and
announce their unavailable state, but cannot be selected. Externally supplied
values remain caller-owned when availability rules change.

## Custom selection groups

`getSelectionDates(date, context)` is available in multiple/range mode. It returns
an array of dates or null to reject the click. Context contains the current
`mode`, normalized `value` and `weekStartsOn`. Use pure callbacks; do not mutate
the context or fetch data inside them.

Returned dates are deduplicated and sorted. The clicked date and every group
member must pass availability and bounds. An empty/invalid group, or any blocked
member, rejects the whole group. Groups are never silently clipped. The clicked
date need not belong to the returned group, allowing rules such as selecting the
workdays of its week.

A group in range mode must be contiguous. It commits the complete interval with
one click. Use multiple mode for noncontiguous groups. A normal two-click range
also validates every interior date at completion; a blocked interior date leaves
the pending start intact and displays an accessible status message. Metadata
callbacks can therefore be called for interior dates outside the visible month.
Validation scans the interval without building an array of all its dates.

Two composable resolver presets are exported:

- `dateWindowSelection({ before, after })` returns a resolver for a window around
  the clicked date. The defaults include the previous day, clicked day and next
  day. Offsets must be nonnegative integers.
- `dateWeekSelection` is a resolver for the complete week, using the picker's
  weekStartsOn. Pass the function directly as a prop.

Both presets work with multiple or range mode and preserve date-only arithmetic
across month/year boundaries. A group crossing the supported calendar boundary
is rejected rather than shortened. Arbitrary resolvers can filter, expand or
replace these dates; the Custom Selection story selects workdays only.

## State, forms and focus

Use `defaultValue` instead of `value` for internal state. Native form reset
restores the uncontrolled default and closes the calendar without calling
onChange. Controlled values stay owned by the caller. Selection and clearing
notify only when the value changes. The ref points to the trigger button.

`name` and `form` connect hidden values to FormData:

- Single mode submits one named field; an empty value is an empty string.
- Multiple mode submits one field with the same name per selected date. Read it
  with FormData.getAll(name). An empty set submits no named fields.
- Range mode submits `name.start` and `name.end`. Both are empty for null; a
  pending range submits its start and an empty end.

Browser required-field validation is not added to the hidden values; callers own
required-field and business validation. readOnly retains a focusable value
without opening the calendar. disabled also removes the trigger from tab
navigation and omits its form values.

`locale` formats dates, months, weekdays and numbers; weekStartsOn chooses the
first weekday, starting with Sunday. Arithmetic remains Gregorian and date-only
in every locale. Today uses local civil time and applies the same selection
rule as a calendar click. Built-in action labels use the optional UIProvider
translation function.

Opening focuses the first selected date, or Today clamped to bounds:

- Enter, Space or an up/down arrow opens the trigger.
- Left/right moves by day; up/down moves by week.
- Home/End moves to week edges.
- Page Up/Down moves by month; Shift moves by year.
- Enter/Space chooses the focused available date or group.
- Tab visits month navigation, the roving day and footer actions. Leaving the
  popup continues from the trigger in the host's tab order.
- Escape dismisses and returns focus to the trigger. An outside pointer press
  dismisses without stealing the new target's focus.

MenuSurface provides appearance and portals, including inside native dialogs.
ScrollArea handles short viewports. Calendar rows and metadata/status areas
reserve their space. The CSS Module and `--ui-date-picker-*`, shared spacing,
menu and motion tokens in src/theme/tokens.css are the style source of truth.

Month changes slide the date grid with SlidingPages/SlidingPage in both the
popup and inline Calendar. Weekdays, month navigation and footer stay in place.
Only the current and outgoing month are mounted; only the current month can
receive focus. Keyboard month/year jumps, quick reversals and reduced motion
use the same behavior as other SlidingPages consumers. Shared sliding duration
and easing tokens control the transition.

Storybook **Components/DatePicker** includes single, empty, restricted, localized,
states, controlled/form, inside-dialog and viewport examples, plus Date
Information, Multiple, Range, Restricted Range, Three Day Selection, Week
Selection, Toggle Weeks, Custom Selection, Multiple Form and Controlled Range.

## Inline calendar and custom composition

DatePicker now composes the public `Calendar` for its date-selection surface.
Use `Calendar` without a trigger/popup, or `CalendarRoot` and its Header/Grid/
Details/Status/Footer parts for a custom layout. The selection models and
metadata rules described above are shared. See [composition guide](component-composition.md#calendar).
