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
