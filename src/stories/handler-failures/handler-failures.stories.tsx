import type { Meta, StoryObj } from "@storybook/react-vite";
import { LifecycleExample } from "./lifecycle";
import guide from "../../../docs/handler-failures.md?raw";
import { ActionFailureExample } from "./actions";
import { SelectionFailureExample } from "./selections";
import {
  DateFailureExample,
  DraftFailureExample,
  EditableFailureExample,
  FormFailureExample,
  PinFailureExample,
} from "./editors";
import { LayoutFailureExample, SurfaceFailureExample } from "./surfaces";
import {
  PopoverFailureExample,
  SuggestionFailureExample,
  SynchronousFailureExample,
  TableFailureExample,
} from "./other";

const meta = {
  title: "Patterns/HandlerFailures",
  tags: ["autodocs"],
  parameters: { docs: { description: { component: guide } } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Lifecycle: Story = { render: () => <LifecycleExample /> };

export const ButtonAction: Story = { render: () => <ActionFailureExample /> };
export const ConfirmAction: Story = {
  render: () => <ActionFailureExample kind="confirm" />,
};
export const MenuAction: Story = {
  render: () => <ActionFailureExample kind="menu" />,
};
export const CopyCallback: Story = {
  render: () => <ActionFailureExample kind="copy" />,
};
export const SwitchChange: Story = {
  render: () => <SelectionFailureExample />,
};
export const ToggleChange: Story = {
  render: () => <SelectionFailureExample kind="toggle" />,
};
export const CheckboxChange: Story = {
  render: () => <SelectionFailureExample kind="checkbox" />,
};
export const RadioChange: Story = {
  render: () => <SelectionFailureExample kind="radio" />,
};
export const SegmentChange: Story = {
  render: () => <SelectionFailureExample kind="segments" />,
};
export const MenuChoice: Story = {
  render: () => <SelectionFailureExample kind="value-menu" />,
};
export const FormSubmit: Story = { render: () => <FormFailureExample /> };
export const InlineSave: Story = { render: () => <EditableFailureExample /> };
export const CodeComplete: Story = { render: () => <PinFailureExample /> };
export const DateChange: Story = { render: () => <DateFailureExample /> };
export const CalendarChange: Story = {
  render: () => <DateFailureExample calendar />,
};
export const ColorDraft: Story = { render: () => <DraftFailureExample /> };
export const SliderDraft: Story = {
  render: () => <DraftFailureExample kind="slider" />,
};
export const DialogClose: Story = { render: () => <SurfaceFailureExample /> };
export const DrawerClose: Story = {
  render: () => <SurfaceFailureExample drawer />,
};
export const CardClose: Story = {
  render: () => <SurfaceFailureExample card />,
};
export const PopoverOpen: Story = { render: () => <PopoverFailureExample /> };
export const SuggestionChoice: Story = {
  render: () => <SuggestionFailureExample />,
};
export const RowAction: Story = { render: () => <TableFailureExample /> };
export const ResizeDraft: Story = {
  render: () => <LayoutFailureExample resize />,
};
export const SplitDraft: Story = { render: () => <LayoutFailureExample /> };
export const SynchronousThrow: Story = {
  render: () => <SynchronousFailureExample />,
};
