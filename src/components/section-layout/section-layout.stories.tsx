import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  DescriptionList,
  Section,
  SectionGroup,
  SectionLayout,
} from "@lesomnus/nox";
import docs from "../../../docs/section-layout.md?raw";

function RecordSections({ name }: { name: string }) {
  return (
    <SectionGroup>
      <Section aria-label={`${name} information`}>
        <DescriptionList
          columns={1}
          rows={[
            { label: "Name", value: name },
            { label: "Alias", value: <code>{name.toLowerCase()}</code> },
          ]}
        />
      </Section>
      <Section aria-label={`${name} connection`}>
        <strong>Connection</strong>
        <span>Ready</span>
        <Button>Refresh status</Button>
      </Section>
      <Section aria-label={`${name} activity`}>
        <strong>Activity</strong>
        <span>Recent activity appears here.</span>
      </Section>
    </SectionGroup>
  );
}
const meta = {
  title: "Layout/SectionLayout",
  component: SectionLayout,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: docs } },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "100vw",
          boxSizing: "border-box",
          padding: "calc(3 * var(--ui-space))",
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    align: "center",
    children: (
      <>
        <header style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button>Add entry</Button>
        </header>
        <article aria-label="Workspace">
          <RecordSections name="Workspace" />
        </article>
        <article aria-label="Personal">
          <RecordSections name="Personal" />
        </article>
      </>
    ),
  },
} satisfies Meta<typeof SectionLayout>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const StartAligned: Story = { args: { align: "start", maxWidth: 420 } };
export const FullWidth: Story = { args: { maxWidth: "none" } };
export const Standalone: Story = {
  args: {
    children: (
      <>
        <Section aria-label="Independent information">
          <strong>Information</strong>
          <span>A complete rounded surface.</span>
        </Section>
        <Section aria-label="Independent activity">
          <strong>Activity</strong>
          <span>Independent sections keep their full corner radii.</span>
        </Section>
      </>
    ),
  },
};
export const DynamicSections: Story = {
  render: function DynamicSections(args) {
    const [extra, setExtra] = useState(true);
    return (
      <SectionLayout {...args}>
        <Button onClick={() => setExtra((value) => !value)}>
          {extra ? "Remove last section" : "Add last section"}
        </Button>
        <SectionGroup>
          <Section aria-label="Information">
            <strong>Information</strong>
            <span>Related content stays together.</span>
          </Section>
          {extra && (
            <Section aria-label="Optional activity">
              <strong>Activity</strong>
              <span>
                Removing this section restores the preceding surface's lower
                corners.
              </span>
            </Section>
          )}
        </SectionGroup>
      </SectionLayout>
    );
  },
};
