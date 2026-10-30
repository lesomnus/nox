import type { Meta, StoryObj } from "@storybook/react-vite";
import { LifecycleExample } from "./lifecycle";
import guide from "../../../docs/handler-failures.md?raw";
import { ActionFailureExample, type ActionKind } from "./actions";
import { SelectionFailureExample, type SelectionKind } from "./selections";
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

export const Action: StoryObj<{ kind: ActionKind }> = {
  args: { kind: "button" },
  argTypes: {
    kind: {
      control: "select",
      options: ["button", "border-trail", "confirm", "file-chip"],
    },
  },
  render: (args) => <ActionFailureExample {...args} />,
};
export const MenuAction: Story = {
  render: () => <ActionFailureExample kind="menu" />,
};
export const CopyCallback: Story = {
  render: () => <ActionFailureExample kind="copy" />,
};
export const LinkAction: StoryObj<{ kind: "link" | "anchor" }> = {
  args: { kind: "link" },
  argTypes: { kind: { control: "select", options: ["link", "anchor"] } },
  render: (args) => <ActionFailureExample {...args} />,
};
export const Selection: StoryObj<{ kind: SelectionKind }> = {
  args: { kind: "switch" },
  argTypes: {
    kind: {
      control: "select",
      options: ["switch", "toggle", "checkbox", "radio", "segments"],
    },
  },
  render: (args) => <SelectionFailureExample {...args} />,
};
export const MenuChoice: StoryObj<{ kind: SelectionKind }> = {
  args: { kind: "value-menu" },
  argTypes: {
    kind: {
      control: "select",
      options: ["value-menu", "prefix-menu", "icon-menu"],
    },
  },
  render: (args) => <SelectionFailureExample {...args} />,
};
export const FormSubmit: Story = { render: () => <FormFailureExample /> };
export const InlineSave: Story = { render: () => <EditableFailureExample /> };
export const CodeComplete: Story = { render: () => <PinFailureExample /> };
export const DateChange: StoryObj<{ control: "date-picker" | "calendar" }> = {
  args: { control: "date-picker" },
  argTypes: {
    control: { control: "select", options: ["date-picker", "calendar"] },
  },
  render: ({ control }) => (
    <DateFailureExample calendar={control === "calendar"} />
  ),
};
export const DraftSave: StoryObj<{
  kind: "color" | "slider" | "setting-slider";
}> = {
  args: { kind: "color" },
  argTypes: {
    kind: { control: "select", options: ["color", "slider", "setting-slider"] },
  },
  render: (args) => <DraftFailureExample {...args} />,
};
export const SaveBeforeClose: StoryObj<{
  surface: "dialog" | "drawer" | "card";
}> = {
  args: { surface: "dialog" },
  argTypes: {
    surface: { control: "select", options: ["dialog", "drawer", "card"] },
  },
  render: ({ surface }) => (
    <SurfaceFailureExample
      drawer={surface === "drawer"}
      card={surface === "card"}
    />
  ),
};
export const PopoverOpen: Story = { render: () => <PopoverFailureExample /> };
export const SuggestionChoice: Story = {
  render: () => <SuggestionFailureExample />,
};
export const RowAction: Story = { render: () => <TableFailureExample /> };
export const LayoutSave: StoryObj<{ layout: "split" | "resize" }> = {
  args: { layout: "split" },
  argTypes: { layout: { control: "select", options: ["split", "resize"] } },
  render: ({ layout }) => <LayoutFailureExample resize={layout === "resize"} />,
};
