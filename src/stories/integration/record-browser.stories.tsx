import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  Checkbox,
  DateTime,
  DescriptionList,
  DialogCard,
  EditableValue,
  IdentifierValue,
  NavigationPanel,
  PanelItem,
} from "@lesomnus/nox";

const meta = {
  title: "Integration/RecordBrowser",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Navigation and record details composed from portable components. All data is local to this story; no application stylesheet, backend, router, or settings store is loaded.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Example() {
    const [selected, setSelected] = useState(0);
    const [names, setNames] = useState([
      "Design system",
      "Component gallery",
      "Documentation",
    ]);
    const [archived, setArchived] = useState(false);
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
          gap: "var(--ui-space)",
          height: 400,
        }}
      >
        <NavigationPanel
          title="Workspaces"
          scrollAreaProps={{ scrollbarLabel: "Scroll workspaces" }}
        >
          {names.map((name, index) => (
            <PanelItem
              key={index}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              {name}
            </PanelItem>
          ))}
        </NavigationPanel>
        <DialogCard title="Information">
          <DescriptionList
            columns={1}
            rows={[
              {
                label: "ID",
                value: (
                  <IdentifierValue
                    value={`1a2b3c${selected}-5e6f-7788-9900-aabbccddeeff`}
                  />
                ),
              },
              {
                label: "Name",
                value: (
                  <EditableValue
                    key={selected}
                    label="Name"
                    value={names[selected]}
                    save={async (value) =>
                      setNames(
                        names.map((name, i) => (i === selected ? value : name)),
                      )
                    }
                  />
                ),
              },
              {
                label: "Created",
                value: <DateTime value="2026-10-20T02:38:19Z" />,
              },
              {
                label: "Archived",
                description: "Archived records remain available for reference.",
                value: (
                  <Checkbox
                    aria-label="Archived"
                    checked={archived}
                    onChange={(e) => setArchived(e.currentTarget.checked)}
                  />
                ),
              },
            ]}
          />
        </DialogCard>
      </div>
    );
  },
};
