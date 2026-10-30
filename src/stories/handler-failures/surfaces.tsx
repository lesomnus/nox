import { useRef, useState } from "react";
import {
  ActionError,
  Button,
  Card,
  CardActions,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  ResizeHandle,
  SplitLayout,
  useAsyncAction,
  type SplitNode,
} from "@lesomnus/nox";
import { Example, useFailOnce } from "./shared";
import styles from "./examples.module.css";

export function SurfaceFailureExample({
  drawer = false,
  card = false,
  showRetry = false,
}: {
  drawer?: boolean;
  card?: boolean;
  showRetry?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const failOnce = useFailOnce();
  const cancel = useRef<HTMLButtonElement>(null);
  const surface = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const submit = useRef<HTMLButtonElement>(null);
  const save = useAsyncAction(async () => {
    await failOnce();
    setSaved(true);
    setOpen(false);
  });
  const run = async () => {
    if (await save.run()) requestAnimationFrame(() => opener.current?.focus());
  };
  const actions = (
    <>
      <Button
        ref={submit}
        type="button"
        loading={save.pending}
        onClick={() => void run()}
      >
        Save changes
      </Button>
      <Button
        ref={cancel}
        type="button"
        disabled={save.pending}
        onClick={() => setOpen(false)}
      >
        Discard
      </Button>
    </>
  );
  const body = (
    <>
      <p>
        Closing saves this draft. A failed save keeps the editor open. Discard
        closes without saving.
      </p>
      {save.error && (
        <ActionError
          onDismiss={save.reset}
          anchor={submit.current}
          showRetry={showRetry}
          pending={save.pending}
          onRetry={() => void run()}
        >
          Save failed. Your changes are still here.
        </ActionError>
      )}
    </>
  );
  return (
    <Example title={drawer ? "Drawer" : card ? "Card" : "Dialog"}>
      <Button
        ref={opener}
        type="button"
        onClick={() => {
          save.reset();
          setSaved(false);
          setOpen(true);
        }}
      >
        Open editor
      </Button>
      {card ? (
        open && (
          <Card
            title="Edit workspace"
            close={save.pending ? undefined : () => void run()}
            closeLabel="Close editor"
            footer={<CardActions>{actions}</CardActions>}
          >
            {body}
          </Card>
        )
      ) : drawer ? (
        <Drawer
          ref={surface}
          open={open}
          onClose={() => void run()}
          dismissible={!save.pending}
          initialFocus={cancel}
          aria-label="Edit workspace"
          width={420}
        >
          <Card
            title="Edit workspace"
            footer={<CardActions>{actions}</CardActions>}
          >
            {body}
          </Card>
        </Drawer>
      ) : (
        <Dialog
          ref={surface}
          open={open}
          onClose={() => void run()}
          dismissible={!save.pending}
          initialFocus={cancel}
          aria-busy={save.pending}
        >
          <DialogHeader>
            <DialogTitle>Edit workspace</DialogTitle>
          </DialogHeader>
          <DialogBody>{body}</DialogBody>
          <DialogFooter>{actions}</DialogFooter>
        </Dialog>
      )}
      {saved && <p role="status">Workspace saved</p>}
    </Example>
  );
}

const initial: SplitNode = {
  kind: "split",
  id: "panes",
  axis: "horizontal",
  ratio: 0.5,
  first: { kind: "pane", id: "Files" },
  second: { kind: "pane", id: "Preview" },
};
export function LayoutFailureExample({
  resize = false,
  showRetry = false,
}: {
  resize?: boolean;
  showRetry?: boolean;
}) {
  const [node, setNode] = useState<SplitNode>(initial);
  const [width, setWidth] = useState(180);
  const [saved, setSaved] = useState("Not saved");
  const submit = useRef<HTMLButtonElement>(null);
  const failOnce = useFailOnce();
  const save = useAsyncAction(async (next: string) => {
    await failOnce();
    setSaved(next);
  });
  const draft = resize ? String(width) : JSON.stringify(node);
  return (
    <Example title={resize ? "ResizeHandle" : "SplitLayout"}>
      <p>
        Resize locally, then persist the complete layout. A failed save keeps
        the current layout.
      </p>
      <div className={styles.panes}>
        {resize ? (
          <>
            <div className={styles.pane} style={{ flex: `0 0 ${width}px` }}>
              Files
            </div>
            <ResizeHandle
              value={width}
              min={80}
              max={300}
              label="Resize files"
              onChange={(next) => {
                setWidth(next);
                save.reset();
              }}
              onReset={() => {
                setWidth(180);
                save.reset();
              }}
            />
            <div className={styles.pane}>Preview</div>
          </>
        ) : (
          <SplitLayout
            node={node}
            onChange={(next) => {
              setNode(next);
              save.reset();
            }}
            renderPane={(id) => <div className={styles.pane}>{id}</div>}
          />
        )}
      </div>
      <Button
        ref={submit}
        type="button"
        loading={save.pending}
        onClick={() => void save.run(draft)}
      >
        Save layout
      </Button>
      {save.error && (
        <ActionError
          onDismiss={save.reset}
          anchor={submit.current}
          showRetry={showRetry}
          pending={save.pending}
          onRetry={() => {
            submit.current?.focus();
            void save.run(draft);
          }}
        >
          Layout could not be saved. Your current layout is preserved.
        </ActionError>
      )}
      <output aria-label="Saved value">{saved}</output>
    </Example>
  );
}
