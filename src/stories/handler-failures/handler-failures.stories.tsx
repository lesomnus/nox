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
  args: { showRetry: false },
  argTypes: { showRetry: { control: "boolean" } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
type Recipe<Props> = StoryObj<Props & { showRetry?: boolean }>;
export const Lifecycle: Story = {
  argTypes: { showRetry: { control: false, table: { disable: true } } },
  render: () => <LifecycleExample />,
};

export const Action: Recipe<{ kind: ActionKind }> = {
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
  render: (args) => <ActionFailureExample {...args} kind="menu" />,
};
export const CopyCallback: Story = {
  render: (args) => <ActionFailureExample {...args} kind="copy" />,
};
export const LinkAction: Recipe<{ kind: "link" | "anchor" }> = {
  args: { kind: "link" },
  argTypes: { kind: { control: "select", options: ["link", "anchor"] } },
  render: (args) => <ActionFailureExample {...args} />,
};
export const Selection: Recipe<{ kind: SelectionKind }> = {
  args: { kind: "switch" },
  argTypes: {
    kind: {
      control: "select",
      options: ["switch", "toggle", "checkbox", "radio", "segments"],
    },
  },
  render: (args) => <SelectionFailureExample {...args} />,
};
export const MenuChoice: Recipe<{ kind: SelectionKind }> = {
  args: { kind: "value-menu" },
  argTypes: {
    kind: {
      control: "select",
      options: ["value-menu", "prefix-menu", "icon-menu"],
    },
  },
  render: (args) => <SelectionFailureExample {...args} />,
};
export const FormSubmit: Story = {
  render: (args) => <FormFailureExample {...args} />,
};
export const InlineSave: Story = {
  argTypes: { showRetry: { control: false, table: { disable: true } } },
  render: () => <EditableFailureExample />,
};
export const CodeComplete: Story = {
  render: (args) => <PinFailureExample {...args} />,
};
export const DateChange: Recipe<{ control: "date-picker" | "calendar" }> = {
  args: { control: "date-picker" },
  argTypes: {
    control: { control: "select", options: ["date-picker", "calendar"] },
  },
  render: ({ control, showRetry }) => (
    <DateFailureExample
      calendar={control === "calendar"}
      showRetry={showRetry}
    />
  ),
};
export const DraftSave: Recipe<{
  kind: "color" | "slider" | "setting-slider";
}> = {
  args: { kind: "color" },
  argTypes: {
    kind: { control: "select", options: ["color", "slider", "setting-slider"] },
  },
  render: (args) => <DraftFailureExample {...args} />,
};
export const SaveBeforeClose: Recipe<{
  surface: "dialog" | "drawer" | "card";
}> = {
  args: { surface: "dialog" },
  argTypes: {
    surface: { control: "select", options: ["dialog", "drawer", "card"] },
  },
  render: ({ surface, showRetry }) => (
    <SurfaceFailureExample
      drawer={surface === "drawer"}
      card={surface === "card"}
      showRetry={showRetry}
    />
  ),
};
export const PopoverOpen: Story = {
  render: (args) => <PopoverFailureExample {...args} />,
};
export const SuggestionChoice: Story = {
  render: (args) => <SuggestionFailureExample {...args} />,
};
export const RowAction: Story = {
  render: (args) => <TableFailureExample {...args} />,
};
export const LayoutSave: Recipe<{ layout: "split" | "resize" }> = {
  args: { layout: "split" },
  argTypes: { layout: { control: "select", options: ["split", "resize"] } },
  render: ({ layout, showRetry }) => (
    <LayoutFailureExample resize={layout === "resize"} showRetry={showRetry} />
  ),
};
