import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, PageToolbar, ValueMenu } from "@lesomnus/nox";

const meta = {
  title: "Layout/PageToolbar",
  component: PageToolbar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A persistent page header with a flexible leading area for selectors, breadcrumbs or titles and an optional trailing area for actions. Content scrolls independently below it.",
      },
    },
  },
} satisfies Meta<typeof PageToolbar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ProjectSelector: Story = {
  render: function Example() {
    const [project, choose] = useState("web");
    return (
      <PageToolbar aria-label="Project toolbar">
        <div style={{ width: "min(280px, 100%)" }}>
          <ValueMenu
            label="Select project"
            value={project}
            options={[
              { value: "web", label: "Web workspace" },
              { value: "api", label: "API workspace" },
            ]}
            choose={choose}
            searchable
          />
        </div>
      </PageToolbar>
    );
  },
};
export const WithActions: Story = {
  args: {
    children: "Workspace",
    actions: <Button>Refresh</Button>,
  },
};
