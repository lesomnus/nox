import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  Checkbox,
  LinkButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@lesomnus/nox";

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

export const TableRows: Story = {
  render: function SessionLinks() {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <Table aria-label="Sessions">
        <TableHeader>
          <TableRow>
            <TableHead aria-label="Select" />
            <TableHead>Name</TableHead>
            <TableHead>State</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            { name: "Release notes", alias: "oak", state: "Working" },
            { name: "Review changes", alias: "seal", state: "Stopped" },
          ].map(({ name, alias, state }) => (
            <TableRow key={alias} selected={selected.includes(alias)}>
              <TableCell>
                <Checkbox
                  aria-label={`Select ${name}`}
                  checked={selected.includes(alias)}
                  onChange={(event) => {
                    const checked = event.currentTarget.checked;
                    setSelected((current) =>
                      checked
                        ? [...current, alias]
                        : current.filter((value) => value !== alias),
                    );
                  }}
                />
              </TableCell>
              <TableCell>
                <LinkButton
                  variant="table"
                  detail={alias}
                  inactive={state === "Stopped"}
                  href={`#${alias}`}
                >
                  {name}
                </LinkButton>
              </TableCell>
              <TableHead scope="row">{state}</TableHead>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
};
