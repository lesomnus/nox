import { useId, useRef, useState, type ReactNode } from "react";
import { ActionError, useAsyncAction } from "@lesomnus/nox";
import styles from "./examples.module.css";

/** A deterministic request double, local to Storybook. */
export function useFailOnce() {
  const attempts = useRef(0);
  return async () => {
    const attempt = ++attempts.current;
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (attempt === 1) throw new Error("Connection lost. Please try again.");
  };
}

export function useCommit<Value>(initial: Value, showRetry = false) {
  const [value, setValue] = useState(initial);
  const controlRef = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLElement | null>(null);
  const requested = useRef(initial);
  const failOnce = useFailOnce();
  const action = useAsyncAction(async (next: Value) => {
    requested.current = next;
    await failOnce();
    setValue(next);
  });
  const id = useId();
  const change = async (next: Value) => {
    const root = controlRef.current;
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && root?.contains(focused))
      anchor.current = focused;
    else if (!anchor.current?.isConnected)
      anchor.current =
        root?.querySelector<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), [tabindex="0"]',
        ) ?? root;
    await action.run(next);
    requestAnimationFrame(() => {
      if (document.activeElement !== document.body) return;
      const root = controlRef.current;
      const target =
        root?.querySelector<HTMLElement>("input:checked:not(:disabled)") ??
        root?.querySelector<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), [tabindex="0"]',
        );
      target?.focus({ preventScroll: true });
    });
  };
  return {
    controlRef,
    value,
    pending: action.pending,
    error: action.error,
    description: action.error ? id : undefined,
    change: (next: Value) => void change(next),
    feedback: action.error && (
      <ActionError
        onDismiss={action.reset}
        showRetry={showRetry}
        anchor={anchor.current ?? controlRef.current}
        id={id}
        pending={action.pending}
        onRetry={() => void change(requested.current)}
      >
        {action.error.message} The saved value is unchanged.
      </ActionError>
    ),
  };
}

export function Example({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.example} aria-label={`${title} failure example`}>
      <h3>{title}</h3>
      <p>First attempt fails. Retry succeeds.</p>
      {children}
    </section>
  );
}
