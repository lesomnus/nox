import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button, ListDetailPages } from "@lesomnus/nox";
import docs from "../../../docs/list-detail-pages.md?raw";
function Detail({ close }: { close: () => void }) {
  const [draft, setDraft] = useState("");
  return (
    <div>
      <label>
        Draft
        <input
          aria-label="Draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </label>
      <Button onClick={close}>Close detail</Button>
    </div>
  );
}
const meta = {
  title: "Layout/ListDetailPages",
  component: ListDetailPages,
  args: { open: false, list: null, detail: null },
  tags: ["autodocs"],
  parameters: { docs: { description: { component: docs } } },
  render: function Example() {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ width: 520, height: 280, display: "flex" }}>
        <ListDetailPages
          open={open}
          list={
            <div>
              <p>The list retains its state while detail is open.</p>
              <Button onClick={() => setOpen(true)}>Open detail</Button>
            </div>
          }
          detail={<Detail close={() => setOpen(false)} />}
        />
      </div>
    );
  },
} satisfies Meta<typeof ListDetailPages>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
