import type { Meta, StoryObj } from "@storybook/react-vite";
import { LinkButton } from "@lesomnus/nox";

const meta = {
  title: "Components/LinkButton",
  component: LinkButton,
  tags: ["autodocs"],
  args: { href: "#account", children: "Personal account" },
} satisfies Meta<typeof LinkButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithoutArrow: Story = { args: { trailing: null } };
export const Truncated: Story = {
  args: {
    children: "A long account name that does not fit inside this link",
    style: { width: 180 },
  },
};
export const NewTab: Story = {
  args: {
    href: "https://github.com/lesomnus/nox",
    target: "_blank",
    rel: "noreferrer",
    children: "Nox repository",
  },
};
