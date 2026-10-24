import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ScrollArea,
} from "@lesomnus/nox";
import styles from "./dialog.stories.module.css";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  args: { open: false, onClose: () => {} },
  parameters: {
    docs: {
      description: {
        component:
          "Controlled native modal Dialog with freely composed Header, Title, Description, Body and Footer. Title and Description register accessible labels automatically. The host owns all actions, async work, validation and errors. Escape/backdrop request onClose unless dismissible=false. Focus returns to the opener.",
      },
    },
  },
  render: function Basic(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Dialog {...args} open={open} onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Workspace information</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              Reusable content with caller-owned actions.
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const CustomFooter: Story = {
  render: function CustomFooter(args) {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        {message && <p role="status">{message}</p>}
        <Dialog {...args} open={open} onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Export data</DialogTitle>
          </DialogHeader>
          <DialogBody>
            Choose any action. No confirmation workflow is built in.
          </DialogBody>
          <DialogFooter>
            <span style={{ marginRight: "auto" }}>JSON or CSV</span>
            <Button
              variant="outline"
              onClick={() => setMessage("JSON exported")}
            >
              JSON
            </Button>
            <Button variant="solid" onClick={() => setMessage("CSV exported")}>
              CSV
            </Button>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};

export const Form: Story = {
  render: function Form(args) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const input = useRef<HTMLInputElement>(null);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        {name && <p role="status">Saved: {name}</p>}
        <Dialog
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          initialFocus={input}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setName(input.current!.value);
              setOpen(false);
            }}
          >
            <DialogHeader>
              <DialogTitle>Edit workspace</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <label>
                Workspace name{" "}
                <input ref={input} required defaultValue="work" />
              </label>
            </DialogBody>
            <DialogFooter>
              <Button type="submit" variant="solid">
                Save
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </>
    );
  },
};

function Operation({ failFirst = false }: { failFirst?: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const attempt = useRef(0);
  const pending = useRef(false);
  const cancel = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  async function save() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setFailed(false);
    dialog.current?.focus();
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (failFirst && attempt.current++ === 0) setFailed(true);
    else {
      setCompleted(true);
      setOpen(false);
    }
    pending.current = false;
    setBusy(false);
  }
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
          setCompleted(false);
          setFailed(false);
          attempt.current = 0;
        }}
      >
        Open operation
      </Button>
      {completed && <p role="status">Action completed</p>}
      <Dialog
        ref={dialog}
        open={open}
        onClose={() => setOpen(false)}
        dismissible={!busy}
        initialFocus={cancel}
        aria-busy={busy}
      >
        <DialogHeader>
          <DialogTitle>Save workspace</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p>
            Pending state, failures and retry are defined by this example's
            caller.
          </p>
          {failed && <p role="alert">Save failed. Try again.</p>}
        </DialogBody>
        <DialogFooter>
          <Button loading={busy} disabled={busy} onClick={() => void save()}>
            Save changes
          </Button>
          <Button ref={cancel} disabled={busy} onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
export const AsyncAction: Story = { render: () => <Operation /> };
export const FailureAndRetry: Story = { render: () => <Operation failFirst /> };

export const LongContent: Story = {
  render: function LongContent(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Dialog {...args} open={open} onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Resources</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <ScrollArea
              className={styles.longContent}
              contentClassName={styles.longContentText}
              scrollbarLabel="Scroll resources"
            >
              {Array.from({ length: 30 }, (_, index) => (
                <p key={index}>
                  Resource {index + 1}: saved history and workspace artifacts.
                </p>
              ))}
            </ScrollArea>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};

export const WithoutFooter: Story = {
  render: function WithoutFooter(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Dialog {...args} open={open} onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Read-only information</DialogTitle>
          </DialogHeader>
          <DialogBody>
            Press Escape or click outside to dismiss. No footer is required.
          </DialogBody>
        </Dialog>
      </>
    );
  },
};

export const Nested: Story = {
  render: function Nested() {
    const [outer, setOuter] = useState(false);
    const [inner, setInner] = useState(false);
    return (
      <>
        <Button onClick={() => setOuter(true)}>Open dialog</Button>
        <Dialog open={outer} onClose={() => setOuter(false)}>
          <DialogHeader>
            <DialogTitle>Outer dialog</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Button onClick={() => setInner(true)}>Open nested dialog</Button>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setOuter(false)}>Close outer</Button>
          </DialogFooter>
        </Dialog>
        <Dialog open={inner} onClose={() => setInner(false)}>
          <DialogHeader>
            <DialogTitle>Inner dialog</DialogTitle>
          </DialogHeader>
          <DialogBody>
            Native modal stacking keeps the outer dialog inert.
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setInner(false)}>Close inner</Button>
          </DialogFooter>
        </Dialog>
      </>
    );
  },
};
