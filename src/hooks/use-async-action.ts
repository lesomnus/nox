import { useCallback, useLayoutEffect, useRef, useState } from "react";

export type AsyncActionState<Args extends unknown[]> = {
  pending: boolean;
  error: Error | undefined;
  /** Returns false on failure, duplicate activation, or completion after unmount. */
  run: (...args: Args) => Promise<boolean>;
  /** Clear feedback only; this does not cancel the operation. */
  reset: () => void;
};

/** Opt-in event action state. Controlled values and success effects stay with the caller. */
export function useAsyncAction<Args extends unknown[]>(
  action: (...args: Args) => unknown,
): AsyncActionState<Args> {
  const latest = useRef(action);
  useLayoutEffect(() => {
    latest.current = action;
  });
  const alive = useRef(true);
  const running = useRef(false);
  const generation = useRef(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error>();
  useLayoutEffect(() => {
    alive.current = true;
    if (!running.current) setPending(false);
    return () => {
      alive.current = false;
      generation.current++;
      running.current = false;
    };
  }, []);
  const run = useCallback(async (...args: Args) => {
    if (running.current || !alive.current) return false;
    running.current = true;
    const request = ++generation.current;
    const current = () => alive.current && generation.current === request;
    setPending(true);
    // Keep failure feedback mounted during a retry, including its focused button.
    try {
      await latest.current(...args);
      if (!current()) return false;
      setError(undefined);
      return true;
    } catch (cause) {
      if (current())
        setError(
          cause instanceof Error
            ? cause
            : new Error(
                typeof cause === "string"
                  ? cause
                  : "Action failed. Please try again.",
                { cause },
              ),
        );
      return false;
    } finally {
      if (current()) {
        running.current = false;
        setPending(false);
      }
    }
  }, []);
  const reset = useCallback(() => {
    if (alive.current) setError(undefined);
  }, []);
  return { pending, error, run, reset };
}
