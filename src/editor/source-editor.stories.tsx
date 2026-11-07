import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SourceEditor } from "@lesomnus/nox/editor";
const meta = {
  title: "Editor/SourceEditor",
  component: SourceEditor,
  argTypes: { value: { control: false } },
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Omit languageId to detect syntax from registered filename, extension and shebang metadata. getSourceEditorLanguages() lazily lists those registered languages for a selector. Changing languageId updates the existing model in place, retaining the source, cursor, scroll position and undo history; passing undefined restores automatic detection.",
      },
    },
  },
  args: {
    path: "example.ts",
    languageId: "typescript",
    ariaLabel: "File preview",
    value:
      "export function greet(name: string) {\n  return `Hello, ${name}`;\n}\n",
    readOnly: true,
  },
  decorators: [
    (Story) => (
      <div style={{ height: 420 }}>
        <Story />
      </div>
    ),
  ],
  render: function Interactive(args, context) {
    const [value, setValue] = useState(args.value);
    return (
      <SourceEditor
        {...args}
        theme={context.globals.theme === "light" ? "light" : "dark"}
        value={value}
        onChange={setValue}
      />
    );
  },
} satisfies Meta<typeof SourceEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
export const FilePreview: Story = {};
export const AutoPython: Story = {
  args: {
    path: "script.py",
    languageId: undefined,
    value:
      "def greet(name):\n    # Automatically detected from .py\n    return f'Hello, {name}'\n\nprint(greet('world'))\n",
  },
};
export const AutoDockerfile: Story = {
  args: {
    path: "Dockerfile",
    languageId: undefined,
    value:
      'FROM node:22-alpine\nWORKDIR /workspace\nCOPY . .\nRUN npm ci\nCMD ["npm", "start"]\n',
  },
};
export const AutoProtobuf: Story = {
  args: {
    path: "api.proto",
    languageId: undefined,
    value:
      'syntax = "proto3";\npackage example;\nmessage Greeting {\n  string text = 1;\n}\n',
  },
};
export const Editable: Story = {
  args: {
    readOnly: false,
    settings: { tabSize: 2, insertSpaces: true, colorPalette: "cool" },
  },
};

export const SettingsJson: Story = {
  args: {
    path: "settings.json",
    languageId: "json",
    readOnly: false,
    value: '{"editor.tabSize": 4}',
  },
};
