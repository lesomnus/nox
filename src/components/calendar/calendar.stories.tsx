import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  Button,
  Calendar,
  CalendarRoot,
  CalendarHeader,
  CalendarMonth,
  CalendarPreviousMonth,
  CalendarNextMonth,
  CalendarGrid,
  CalendarDetails,
  CalendarStatus,
  CalendarFooter,
  CalendarClear,
  CalendarToday,
  dateWeekSelection,
  type DatePickerRange,
} from "@lesomnus/nox";
const meta = {
  title: "Components/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  args: { label: "Schedule", defaultValue: "2026-10-24", name: "date" },
} satisfies Meta<typeof Calendar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Multiple: Story = {
  args: {
    mode: "multiple",
    defaultValue: ["2026-10-21", "2026-10-24"],
    name: "dates",
  },
};
export const Range: Story = {
  args: {
    mode: "range",
    defaultValue: { start: "2026-10-21", end: null },
    name: "period",
  },
};
export const Week: Story = {
  args: {
    mode: "range",
    defaultValue: null,
    defaultMonth: "2026-10-01",
    weekStartsOn: 1,
    getSelectionDates: dateWeekSelection,
  },
};
export const Disabled: Story = { args: { disabled: true } };
export const ReadOnly: Story = { args: { readOnly: true } };
export const Composed: Story = {
  render: function Example() {
    const [value, setValue] = useState<DatePickerRange | null>({
      start: "2026-10-21",
      end: null,
    });
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <CalendarRoot
          label="Custom schedule"
          mode="range"
          value={value}
          onChange={setValue}
          style={{ display: "grid", width: 300, gap: 12 }}
          getDateInfo={(date) =>
            date === "2026-10-26"
              ? {
                  label: "Holiday",
                  description: "Office closed",
                  disabled: true,
                }
              : undefined
          }
        >
          <CalendarHeader
            style={{ gridTemplateColumns: "minmax(0, 1fr) 32px 32px" }}
          >
            <CalendarMonth style={{ textAlign: "left" }} />
            <CalendarPreviousMonth />
            <CalendarNextMonth />
          </CalendarHeader>
          <div>
            <CalendarGrid />
          </div>
          <CalendarDetails />
          <CalendarStatus />
          <CalendarFooter>
            <CalendarClear />
            <CalendarToday />
          </CalendarFooter>
        </CalendarRoot>
        <output aria-label="Selected range">{JSON.stringify(value)}</output>
      </div>
    );
  },
};
export const GridOnly: Story = {
  render: () => (
    <CalendarRoot
      label="Compact schedule"
      defaultValue="2026-10-24"
      style={{ width: 260 }}
    >
      <CalendarGrid />
    </CalendarRoot>
  ),
};
export const Form: Story = {
  render: function Example() {
    const [submitted, setSubmitted] = useState("");
    return (
      <form
        style={{ display: "grid", gap: 12 }}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(
            JSON.stringify(
              Object.fromEntries(new FormData(event.currentTarget)),
            ),
          );
        }}
      >
        <Calendar
          label="Schedule"
          name="period"
          mode="range"
          defaultValue={{ start: "2026-10-21", end: "2026-10-24" }}
        />
        <div>
          <Button effect="none" type="submit">
            Submit
          </Button>
          <Button effect="none" type="reset">
            Reset
          </Button>
        </div>
        <output aria-label="Submitted period">{submitted}</output>
      </form>
    );
  },
};

export const Controlled: Story = {
  render: function Example() {
    const [value, setValue] = useState<string | null>("2026-10-24");
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <Button effect="none" onClick={() => setValue("2027-01-15")}>
          Set date
        </Button>
        <Calendar
          label="Controlled schedule"
          value={value}
          onChange={setValue}
          name="date"
        />
        <output aria-label="Selected date">{value}</output>
      </div>
    );
  },
};

export const Bounded: Story = {
  args: {
    defaultValue: null,
    defaultMonth: "2028-01-01",
    min: "2026-01-01",
    max: "2026-12-31",
  },
};
