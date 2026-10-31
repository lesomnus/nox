import { useId, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  Card,
  CardActions,
  Form,
  FormField,
  ValueMenu,
  type FormProps,
} from "@lesomnus/nox";

const meta = {
  title: "Components/Form",
  component: Form,
  tags: ["autodocs"],
  args: { columns: 2 },
  decorators: [
    (Story) => (
      <div style={{ width: "min(480px, 85vw)" }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Always-editable fields sharing DescriptionList's typography and column layout. Controls use the cxz creation forms' 12px padding, 10px radius, shade-17 background and borderless resting surface. Labels remain inset by the corner radius, independently of input text padding. ValueMenu keeps the same height and text inset as native inputs. Native validation, submission, refs and as=fieldset grouping stay intact. FormField htmlFor associates native labels, and fullWidth spans the grid. Form owns no data schema or request lifecycle.",
      },
    },
  },
} satisfies Meta<typeof Form>;
export default meta;
type Story = StoryObj<Pick<FormProps, "columns">>;

export const Default: Story = {
  render: function Example(args) {
    const id = useId();
    return (
      <Form {...args} aria-label="Workspace form">
        <FormField label="Name" htmlFor={`${id}-name`}>
          <input id={`${id}-name`} name="name" defaultValue="My workspace" />
        </FormField>
        <FormField label="State" htmlFor={`${id}-state`}>
          <input id={`${id}-state`} name="state" defaultValue="Ready" />
        </FormField>
      </Form>
    );
  },
};

export const InCard: Story = {
  render: function Example(args) {
    const id = useId();
    const [priority, setPriority] = useState("normal");
    const [status, setStatus] = useState("todo");
    const [saved, setSaved] = useState("");
    return (
      <>
        <Card
          title="Edit item"
          footer={
            <CardActions>
              <Button type="submit" form={id}>
                Save
              </Button>
              <Button type="reset" form={id}>
                Reset
              </Button>
            </CardActions>
          }
        >
          <Form
            {...args}
            id={id}
            aria-label="Item form"
            onSubmit={(event) => {
              event.preventDefault();
              const values = Object.fromEntries(
                new FormData(event.currentTarget),
              );
              setSaved(JSON.stringify({ ...values, priority, status }));
            }}
            onReset={() => {
              setPriority("normal");
              setStatus("todo");
            }}
          >
            <FormField label="Priority">
              <ValueMenu
                label="Priority"
                alignItemWithTrigger
                value={priority}
                choose={setPriority}
                options={[
                  { value: "high", label: "High" },
                  { value: "normal", label: "Normal" },
                  { value: "low", label: "Low" },
                ]}
              />
            </FormField>
            <FormField label="Status">
              <ValueMenu
                label="Status"
                alignItemWithTrigger
                value={status}
                choose={setStatus}
                options={[
                  { value: "todo", label: "Todo" },
                  { value: "working", label: "In progress" },
                  { value: "done", label: "Done" },
                ]}
              />
            </FormField>
            <FormField label="Name" htmlFor={`${id}-name`} fullWidth>
              <input
                id={`${id}-name`}
                name="name"
                defaultValue="My workspace"
                required
              />
            </FormField>
            <FormField label="Alias" htmlFor={`${id}-alias`} fullWidth>
              <input id={`${id}-alias`} name="alias" defaultValue="workspace" />
            </FormField>
            <FormField
              label="Description"
              htmlFor={`${id}-description`}
              fullWidth
            >
              <textarea
                id={`${id}-description`}
                name="description"
                rows={4}
                defaultValue="Describe this item."
              />
            </FormField>
          </Form>
        </Card>
        <output aria-label="Saved values">{saved}</output>
      </>
    );
  },
};
