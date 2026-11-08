import type { Meta, StoryObj } from "@storybook/react-vite";
import { SourceDiff } from "@lesomnus/nox/editor";

const original =
  "# Release notes\n\n" +
  "Shared context remains readable while only changed words receive stronger highlighting. ".repeat(
    12,
  ) +
  "The preview uses a line diff without word highlights.\n";
const meta = {
  title: "Editor/SourceDiff",
  component: SourceDiff,
  tags: ["autodocs"],
  args: {
    original,
    modified: original.replace(
      "a line diff without word highlights",
      "an inline comparison with word highlights",
    ),
    path: "notes.md",
    ariaLabel: "Source comparison",
    sideBySide: false,
  },
  decorators: [
    (Story) => (
      <div style={{ height: 480 }}>
        <Story />
      </div>
    ),
  ],
  render: (args, context) => (
    <SourceDiff
      {...args}
      theme={context.globals.theme === "light" ? "light" : "dark"}
    />
  ),
  parameters: {
    docs: {
      description: {
        component:
          "Read-only Monaco comparison with changed word ranges emphasized, word wrapping, folding of unchanged regions, and an initial reveal of the edited phrase. Uses the same lazy editor bundle, theme, font and settings as SourceEditor. Both models and editor subscriptions are disposed on unmount. Set sideBySide to show separate before/after columns; the default is inline.",
      },
    },
  },
} satisfies Meta<typeof SourceDiff>;
export default meta;
type Story = StoryObj<typeof meta>;
export const LongParagraph: Story = {};
