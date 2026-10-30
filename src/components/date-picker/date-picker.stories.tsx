import { DateFailureExample } from "../../stories/handler-failures/editors";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import guide from "../../../docs/date-picker.md?raw";
import {
  Button,
  DatePicker,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dateWeekSelection,
  dateWindowSelection,
  type DatePickerRange,
} from "@lesomnus/nox";

const meta = {
  title: "Components/DatePicker",
  component: DatePicker,
  tags: ["autodocs"],
  args: { label: "Date", name: "date", defaultValue: "2026-10-24" },
  parameters: {
    docs: {
      description: {
        component: guide,
      },
    },
  },
} satisfies Meta<typeof DatePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { defaultValue: null } };
export const Restricted: Story = {
  args: {
    label: "Deadline",
    min: "2026-10-12",
    max: "2026-11-06",
    defaultValue: "2026-10-21",
    isDateDisabled: (value) =>
      [0, 6].includes(new Date(`${value}T00:00:00Z`).getUTCDay()),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Only weekdays within the allowed interval can be selected. Browse the calendar or focus unavailable days to hear their disabled state.",
      },
    },
  },
};
export const Localized: Story = { args: { locale: "ko-KR", weekStartsOn: 1 } };
export const States: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 12 }}>
      <DatePicker {...args} label="Disabled date" disabled />
      <DatePicker {...args} label="Read-only date" readOnly />
      <DatePicker {...args} label="No clear action" clearable={false} />
    </div>
  ),
};
export const Controlled: Story = {
  render: function Example(args) {
    const [value, setValue] = useState<string | null>("2026-10-24");
    if (args.mode === "multiple" || args.mode === "range")
      return <DatePicker {...args} />;
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <DatePicker {...args} value={value} onChange={setValue} />
        <output aria-label="Selected date">{value ?? "No date"}</output>
        <div className="buttons">
          <Button onClick={() => setValue("2027-01-15")}>Set date</Button>
          <Button onClick={() => setValue(null)}>Reset selection</Button>
        </div>
      </div>
    );
  },
};
export const Form: Story = {
  render: function Example(args) {
    const [submitted, setSubmitted] = useState("");
    return (
      <form
        style={{ display: "grid", gap: 12 }}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(
            String(new FormData(event.currentTarget).get("date") ?? ""),
          );
        }}
      >
        <DatePicker {...args} />
        <div className="buttons">
          <Button type="submit">Submit</Button>
          <Button type="reset">Reset form</Button>
        </div>
        <output aria-label="Submitted date">
          {submitted || "No submission"}
        </output>
      </form>
    );
  },
};
export const InsideDialog: Story = {
  render: function Example(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open schedule</Button>
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Schedule</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DatePicker {...args} />
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Close schedule</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};
export const NearViewportEdge: Story = {
  render: (args) => (
    <div style={{ position: "fixed", bottom: 12, right: 12 }}>
      <DatePicker {...args} />
    </div>
  ),
};
export const Unavailable: Story = {
  args: { isDateDisabled: () => true, defaultValue: null },
};

const companyDates = (date: string) =>
  date === "2026-10-26"
    ? {
        disabled: true,
        label: "Company holiday",
        description: "The office is closed. Choose another date.",
      }
    : date === "2026-10-30"
      ? {
          label: "Release day",
          description: "A selectable event with a custom marker.",
          marker: "◆",
          style: { color: "var(--ui-shade-255)" },
        }
      : undefined;

export const DateInformation: Story = {
  args: { getDateInfo: companyDates },
};
export const Multiple: Story = {
  args: {
    mode: "multiple",
    label: "Dates",
    name: "dates",
    defaultValue: ["2026-10-21", "2026-10-24"],
    getDateInfo: companyDates,
  },
};
export const Range: Story = {
  args: { mode: "range", label: "Period", name: "period", defaultValue: null },
};
export const RestrictedRange: Story = {
  args: {
    mode: "range",
    label: "Period",
    name: "period",
    defaultValue: null,
    min: "2026-10-01",
    max: "2026-11-30",
    getDateInfo: companyDates,
  },
};
export const ThreeDaySelection: Story = {
  args: {
    mode: "multiple",
    label: "Three-day windows",
    name: "dates",
    defaultValue: [],
    getSelectionDates: dateWindowSelection(),
    getDateInfo: companyDates,
    min: "2026-10-01",
    max: "2026-10-31",
  },
};
export const WeekSelection: Story = {
  args: {
    mode: "range",
    label: "Week",
    name: "week",
    defaultValue: null,
    weekStartsOn: 1,
    getSelectionDates: dateWeekSelection,
  },
};
export const ToggleWeeks: Story = {
  args: {
    mode: "multiple",
    label: "Weeks",
    name: "dates",
    defaultValue: [],
    weekStartsOn: 1,
    getSelectionDates: dateWeekSelection,
  },
};
export const CustomSelection: Story = {
  args: {
    mode: "multiple",
    label: "Workdays",
    name: "dates",
    defaultValue: [],
    weekStartsOn: 1,
    getSelectionDates: (date, context) =>
      dateWeekSelection(date, context)?.filter(
        (value) => ![0, 6].includes(new Date(`${value}T00:00:00Z`).getUTCDay()),
      ) ?? null,
  },
};
export const MultipleForm: Story = {
  args: {
    mode: "multiple",
    label: "Dates",
    name: "dates",
    defaultValue: ["2026-10-21"],
  },
  render: function Example(args) {
    const [submitted, setSubmitted] = useState<string[]>([]);
    return (
      <form
        style={{ display: "grid", gap: 12 }}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(
            new FormData(event.currentTarget).getAll("dates").map(String),
          );
        }}
      >
        <DatePicker {...args} />
        <div className="buttons">
          <Button type="submit">Submit</Button>
          <Button type="reset">Reset form</Button>
        </div>
        <output aria-label="Submitted dates">
          {JSON.stringify(submitted)}
        </output>
      </form>
    );
  },
};
export const ControlledRange: Story = {
  args: {
    mode: "range",
    label: "Period",
    name: "period",
    defaultValue: null,
    closeOnSelect: false,
  },
  render: function Example(args) {
    const [value, setValue] = useState<DatePickerRange | null>(null);
    const [submitted, setSubmitted] = useState("");
    if (args.mode !== "range") return <DatePicker {...args} />;
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
        <DatePicker {...args} value={value} onChange={setValue} />
        <output aria-label="Selected range">{JSON.stringify(value)}</output>
        <div className="buttons">
          <Button type="submit">Submit</Button>
          <Button
            type="button"
            onClick={() => setValue({ start: "2026-11-02", end: "2026-11-06" })}
          >
            Set range
          </Button>
          <Button type="button" onClick={() => setValue(null)}>
            Reset selection
          </Button>
        </div>
        <output aria-label="Submitted range">{submitted}</output>
      </form>
    );
  },
};

export const FailureAndRetry = {
  render: () => <DateFailureExample />,
};
