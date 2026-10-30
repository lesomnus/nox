import { useId, useRef, useState } from "react";
import {
  ActionError,
  Button,
  Popover,
  SuggestionGrid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useAsyncAction,
} from "@lesomnus/nox";
import { Example, useCommit, useFailOnce } from "./shared";

export function PopoverFailureExample() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const failOnce = useFailOnce();
  const load = useAsyncAction(async () => {
    await failOnce();
    setLoaded(true);
  });
  return (
    <Example title="Popover">
      <div>
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next && !loaded && !load.error) void load.run();
          }}
          content={
            loaded
              ? "The workspace is ready."
              : load.pending
                ? "Loading details…"
                : "Details could not be loaded."
          }
        >
          <Button ref={trigger} type="button">
            Workspace details
          </Button>
        </Popover>
      </div>
      {load.error && (
        <ActionError
          pending={load.pending}
          onRetry={() => {
            void load.run().then((ok) => {
              if (ok) requestAnimationFrame(() => trigger.current?.focus());
            });
          }}
        >
          Could not load details. The trigger remains usable.
        </ActionError>
      )}
      {loaded && <p role="status">Details loaded</p>}
    </Example>
  );
}

export function SuggestionFailureExample() {
  const state = useCommit(0);
  const id = useId();
  return (
    <Example title="SuggestionGrid">
      <div ref={state.controlRef}>
        <fieldset
          disabled={state.pending}
          style={{ padding: 0, border: 0 }}
          aria-describedby={state.description}
        >
          <SuggestionGrid
            id={id}
            label="Templates"
            selected={state.value}
            items={[{ label: "Starter" }, { label: "Dashboard" }]}
            choose={state.change}
          />
        </fieldset>
      </div>
      {state.feedback}
      <output aria-label="Saved value">
        {state.value === 0 ? "Starter" : "Dashboard"}
      </output>
    </Example>
  );
}

export function TableFailureExample() {
  const [present, setPresent] = useState(true);
  const failOnce = useFailOnce();
  const remove = useAsyncAction(async () => {
    await failOnce();
    setPresent(false);
  });
  return (
    <Example title="Table row action">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Report</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {present && (
            <TableRow>
              <TableCell>Quarterly report</TableCell>
              <TableCell>
                <Button
                  type="button"
                  loading={remove.pending}
                  onClick={() => void remove.run()}
                >
                  Delete report
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {remove.error && (
        <ActionError pending={remove.pending} onRetry={() => void remove.run()}>
          Could not delete this report. The row is unchanged.
        </ActionError>
      )}
      {!present && <p role="status">Report deleted</p>}
    </Example>
  );
}
