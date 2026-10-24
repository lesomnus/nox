import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  NavigationPanel,
  NavigationPanelRoot,
  NavigationPanelHeader,
  NavigationPanelTitle,
  NavigationPanelActions,
  NavigationPanelBody,
  NavigationPanelScrollBody,
  NavigationPanelFooter,
  PanelItem,
} from "@lesomnus/nox";
import { useState } from "react";

const meta = {
  title: "Layout/NavigationPanel",
  component: NavigationPanel,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: 220, height: 440, display: "grid" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    title: "Documents",
    actions: (
      <Button variant="toolbar" aria-label="Add document">
        +
      </Button>
    ),
    scrollAreaProps: { scrollbarLabel: "Scroll documents" },
    children: Array.from({ length: 24 }, (_, i) => (
      <PanelItem key={i} aria-pressed={i === 0}>
        Document {i + 1}
      </PanelItem>
    )),
  },
  parameters: {
    docs: {
      description: {
        component:
          "Fixed header and rounded, inset scroll body. Header actions share DialogCard footer spacing; the body uses the tighter control inset and the same color/radius tokens. No router, resource model or provider required. Supply bounded height.",
      },
    },
  },
} satisfies Meta<typeof NavigationPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Settings: Story = {
  render: function Example() {
    const [value, setValue] = useState("General");
    return (
      <NavigationPanel title="Settings">
        {["General", "Editor"].map((label) => (
          <PanelItem
            key={label}
            aria-pressed={label === value}
            onClick={() => setValue(label)}
          >
            {label}
          </PanelItem>
        ))}
      </NavigationPanel>
    );
  },
};
export const Empty: Story = { args: { children: <p>No documents yet.</p> } };

export const Composed: Story = {
  render: function Example() {
    const [query, setQuery] = useState("");
    const [showTitle, setShowTitle] = useState(true);
    return (
      <NavigationPanelRoot aria-label={showTitle ? undefined : "Documents"}>
        <NavigationPanelHeader style={{ flexWrap: "wrap" }}>
          {showTitle && <NavigationPanelTitle>Documents</NavigationPanelTitle>}
          <NavigationPanelActions>
            <Button variant="toolbar" aria-label="Add document">
              +
            </Button>
          </NavigationPanelActions>
          <input
            aria-label="Filter documents"
            placeholder="Filter documents"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            style={{ flexBasis: "100%", minWidth: 0, margin: 4 }}
          />
        </NavigationPanelHeader>
        <NavigationPanelScrollBody scrollbarLabel="Scroll documents">
          {Array.from({ length: 30 }, (_, i) => `Document ${i + 1}`)
            .filter((name) => name.includes(query))
            .map((name) => (
              <PanelItem key={name}>{name}</PanelItem>
            ))}
        </NavigationPanelScrollBody>
        <NavigationPanelFooter>
          <Button effect="none" onClick={() => setShowTitle((value) => !value)}>
            Toggle title
          </Button>
        </NavigationPanelFooter>
      </NavigationPanelRoot>
    );
  },
};
export const WithoutScroll: Story = {
  render: () => (
    <NavigationPanelRoot>
      <NavigationPanelHeader>
        <NavigationPanelTitle>Shortcuts</NavigationPanelTitle>
      </NavigationPanelHeader>
      <NavigationPanelBody>
        <PanelItem>General</PanelItem>
        <PanelItem>Editor</PanelItem>
      </NavigationPanelBody>
      <NavigationPanelFooter>Version 1.0</NavigationPanelFooter>
    </NavigationPanelRoot>
  ),
};
