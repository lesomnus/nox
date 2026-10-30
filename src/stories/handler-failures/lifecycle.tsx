import { StrictMode, useRef, useState } from "react";
import { ActionError, Button, useAsyncAction } from "@lesomnus/nox";
import { Example } from "./shared";
import styles from "./examples.module.css";

type Deferred = { resolve: () => void; reject: () => void };
function Probe({
  execute,
  result,
}: {
  execute: (value: string) => unknown;
  result: (ok: boolean) => void;
}) {
  const action = useAsyncAction(execute);
  const firstRun = useRef(action.run);
  return (
    <>
      <output aria-label="Pending">{String(action.pending)}</output>
      <output aria-label="Stable callback">
        {String(firstRun.current === action.run)}
      </output>
      <div className={styles.row}>
        <Button
          type="button"
          onClick={() => {
            void action.run("payload").then(result);
            void action.run("duplicate");
          }}
        >
          Run twice
        </Button>
        <Button type="button" onClick={action.reset}>
          Clear feedback
        </Button>
      </div>
      {action.error && (
        <ActionError>
          {action.error.message}
          <span> Cause: {String(action.error.cause)}</span>
        </ActionError>
      )}
    </>
  );
}

export function LifecycleExample() {
  const requests = useRef<Deferred[]>([]);
  const [mounted, setMounted] = useState(true);
  const [revision, setRevision] = useState(1);
  const [calls, setCalls] = useState<string[]>([]);
  const [result, setResult] = useState<boolean>();
  const [mode, setMode] = useState("deferred");
  return (
    <Example title="Action lifecycle">
      <label>
        Handler mode{" "}
        <select
          aria-label="Handler mode"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="deferred">Deferred promise</option>
          <option value="sync">Synchronous throw</option>
          <option value="non-error">Rejected non-Error</option>
          <option value="thenable">Rejected thenable</option>
        </select>
      </label>
      <div className={styles.row}>
        <Button onClick={() => setRevision((v) => v + 1)}>
          Update handler
        </Button>
        <Button onClick={() => setMounted((v) => !v)}>
          {mounted ? "Unmount action" : "Mount action"}
        </Button>
        <Button onClick={() => requests.current.shift()?.resolve()}>
          Resolve oldest
        </Button>
        <Button onClick={() => requests.current.shift()?.reject()}>
          Reject oldest
        </Button>
      </div>
      {mounted && (
        <StrictMode>
          <Probe
            result={setResult}
            execute={(value) => {
              setCalls((previous) => [...previous, `${value}:${revision}`]);
              if (mode === "sync") throw new Error("Synchronous failure");
              if (mode === "non-error") return Promise.reject(null);
              if (mode === "thenable")
                return {
                  then(_resolve: unknown, reject: (reason: unknown) => void) {
                    reject("Thenable failure");
                  },
                };
              return new Promise<void>((resolve, reject) =>
                requests.current.push({
                  resolve,
                  reject: () => reject(new Error("Deferred failure")),
                }),
              );
            }}
          />
        </StrictMode>
      )}
      <output aria-label="Calls">{calls.join(",")}</output>
      <output aria-label="Result">
        {result === undefined ? "Unset" : String(result)}
      </output>
    </Example>
  );
}
