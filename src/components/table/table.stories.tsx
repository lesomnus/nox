import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  Checkbox,
  EditableValue,
  LinkButton,
  Skeleton,
  SkeletonGroup,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  TableScrollArea,
} from "@lesomnus/nox";
import styles from "./table.stories.module.css";

const meta = {
  title: "Components/Table",
  component: Table,
  tags: ["autodocs"],
  args: { stickyHeader: true },
} satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;

const sessions = [
  {
    id: "design",
    name: "Design system",
    account: "Personal",
    state: "Working",
    tasks: 12,
  },
  {
    id: "api",
    name: "API integration",
    account: "Work",
    state: "Waiting for input",
    tasks: 8,
  },
  {
    id: "docs",
    name: "Documentation",
    account: "Personal",
    state: "Idle",
    tasks: 3,
  },
  {
    id: "release",
    name: "Release preparation",
    account: "Work",
    state: "Stopped",
    tasks: 5,
  },
];

function Columns({ selection = false }: { selection?: boolean }) {
  return (
    <colgroup>
      {selection && <col className={styles.selection} />}
      <col className={styles.name} />
      <col className={styles.account} />
      <col className={styles.state} />
      <col className={styles.number} />
    </colgroup>
  );
}

function Headings() {
  return (
    <>
      <TableHead>Name</TableHead>
      <TableHead>Account</TableHead>
      <TableHead>State</TableHead>
      <TableHead align="right">Tasks</TableHead>
    </>
  );
}

export const Default: Story = {
  render: (args) => (
    <Table {...args} className={styles.table}>
      <TableCaption>Project sessions</TableCaption>
      <Columns />
      <TableHeader>
        <TableRow>
          <Headings />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.id}>
            <TableHead scope="row">{session.name}</TableHead>
            <TableCell className={styles.muted}>{session.account}</TableCell>
            <TableCell className={styles.muted}>{session.state}</TableCell>
            <TableCell align="right" className={styles.number}>
              {session.tasks}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableHead scope="row" colSpan={3}>
            Total tasks
          </TableHead>
          <TableCell align="right">28</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const Selectable: Story = {
  render: function Example(args) {
    const [selected, select] = useState<string[]>([]);
    const all = selected.length === sessions.length;
    return (
      <div>
        <div className={styles.toolbar}>
          <span>Sessions</span>
          <output aria-label="Selected sessions">
            {selected.length} selected
          </output>
        </div>
        <Table {...args} aria-label="Sessions" className={styles.table}>
          <Columns selection />
          <TableHeader>
            <TableRow>
              <TableHead align="center">
                <Checkbox
                  aria-label="Select all sessions"
                  checked={all}
                  indeterminate={selected.length > 0 && !all}
                  onChange={(event) =>
                    select(
                      event.currentTarget.checked
                        ? sessions.map((session) => session.id)
                        : [],
                    )
                  }
                />
              </TableHead>
              <Headings />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow
                key={session.id}
                selected={selected.includes(session.id)}
              >
                <TableCell align="center">
                  <Checkbox
                    aria-label={`Select ${session.name}`}
                    checked={selected.includes(session.id)}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;
                      select((current) =>
                        checked
                          ? [...current, session.id]
                          : current.filter((id) => id !== session.id),
                      );
                    }}
                  />
                </TableCell>
                <TableHead scope="row">{session.name}</TableHead>
                <TableCell>
                  <LinkButton
                    href={`#account-${session.account.toLowerCase()}`}
                    className={styles.accountLink}
                  >
                    {session.account}
                  </LinkButton>
                </TableCell>
                <TableCell className={styles.muted}>{session.state}</TableCell>
                <TableCell align="right">{session.tasks}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  },
};

export const Editable: Story = {
  render: function Example(args) {
    const [rows, setRows] = useState(sessions);
    return (
      <Table {...args} className={styles.table} aria-label="Editable sessions">
        <Columns />
        <TableHeader>
          <TableRow>
            <Headings />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((session) => (
            <TableRow key={session.id}>
              <TableCell>
                <EditableValue
                  label={`Name of ${session.id}`}
                  value={session.name}
                  save={async (name) =>
                    setRows((current) =>
                      current.map((row) =>
                        row.id === session.id ? { ...row, name } : row,
                      ),
                    )
                  }
                />
              </TableCell>
              <TableCell>{session.account}</TableCell>
              <TableCell className={styles.muted}>{session.state}</TableCell>
              <TableCell align="right">{session.tasks}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  },
};

export const Scrolling: Story = {
  render: (args) => (
    <TableScrollArea
      className={styles.scroll}
      role="region"
      aria-label="Session list"
      scrollbarLabel="Scroll sessions"
    >
      <Table {...args} aria-label="Sessions" className={styles.table}>
        <Columns />
        <TableHeader>
          <TableRow>
            <Headings />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 32 }, (_, index) => {
            const session = sessions[index % sessions.length];
            return (
              <TableRow key={index}>
                <TableCell>
                  {session.name} {index + 1}
                </TableCell>
                <TableCell className={styles.muted}>
                  {session.account}
                </TableCell>
                <TableCell className={styles.muted}>{session.state}</TableCell>
                <TableCell align="right">{session.tasks}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableScrollArea>
  ),
};

export const HorizontalOverflow: Story = {
  decorators: [
    (Story) => (
      <div className={styles.horizontal}>
        <Story />
      </div>
    ),
  ],
  render: Scrolling.render,
};

export const Empty: Story = {
  render: (args) => (
    <Table {...args} className={styles.table} aria-label="Sessions">
      <Columns />
      <TableHeader>
        <TableRow>
          <Headings />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={4} align="center" className={styles.empty}>
            No sessions yet.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const Loading: Story = {
  render: (args) => (
    <SkeletonGroup>
      <Table {...args} className={styles.table} aria-label="Sessions" aria-busy>
        <TableCaption className={styles.srOnly}>
          <span role="status">Loading sessions…</span>
        </TableCaption>
        <Columns />
        <TableHeader>
          <TableRow>
            <Headings />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }, (_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton width={index % 2 ? "78%" : "60%"} />
              </TableCell>
              <TableCell>
                <Skeleton width="70%" />
              </TableCell>
              <TableCell>
                <Skeleton width={index % 2 ? "85%" : "50%"} />
              </TableCell>
              <TableCell>
                <Skeleton width="30%" style={{ marginLeft: "auto" }} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SkeletonGroup>
  ),
};
