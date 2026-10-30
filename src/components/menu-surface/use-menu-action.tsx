import { useRef } from "react";
import { useAsyncAction } from "../../hooks/use-async-action";
import { ActionError } from "../action-error/action-error";

/** Shared async command/selection lifecycle; manual dismissal never cancels work. */
export function useMenuAction(
  awaitAction: boolean,
  close: (restore?: boolean) => void,
) {
  const action = useAsyncAction((run: () => unknown) => run());
  const busy = useRef(false);
  const generation = useRef(0);
  const active = useRef<{
    key: string;
    anchor: HTMLElement;
    generation: number;
  }>(undefined);
  const feedback = useRef<HTMLDivElement>(null);
  function clear() {
    generation.current++;
    action.reset();
  }
  function invoke(
    run: () => unknown,
    anchor: HTMLElement,
    key: string,
    closeOnSuccess = true,
  ) {
    if (busy.current) return;
    if (!awaitAction) {
      close(true);
      run();
      return;
    }
    anchor.focus({ preventScroll: true });
    action.reset();
    const request = ++generation.current;
    active.current = { key, anchor, generation: request };
    busy.current = true;
    void action.run(run).then((success) => {
      busy.current = false;
      // A later result must not close a menu the user dismissed and reopened.
      if (success && generation.current === request && closeOnSuccess)
        close(true);
    });
  }
  const current = active.current;
  return {
    pending: action.pending,
    isRunning: () => busy.current,
    activeKey: current?.key,
    invoke,
    clear,
    containsFeedback: (target: Node | null) =>
      !!target && !!feedback.current?.contains(target),
    feedback:
      awaitAction &&
      action.error &&
      current?.generation === generation.current ? (
        <ActionError
          ref={feedback}
          anchor={current.anchor.isConnected ? current.anchor : null}
          onDismiss={action.reset}
        >
          {action.error.message}
        </ActionError>
      ) : null,
  };
}
