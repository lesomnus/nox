import {
  resolveThemePreference,
  type ThemePreference,
  type ThemeStorage,
} from "./theme-storage";

export type ThemeSnapshot = {
  preference: ThemePreference;
  ready: boolean;
  saving: boolean;
  error: Error | null;
};
const asError = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

/** Provider-owned state: ordered writes and stale-read protection live outside React. */
export class ThemeStore {
  private value: ThemeSnapshot;
  private initial: ThemeSnapshot;
  private listeners = new Set<() => void>();
  private readVersion = 0;
  private writeVersion = 0;
  private connected = false;
  private writes = 0;
  private refreshAfterWrite = false;
  private tail = Promise.resolve();

  constructor(
    private storage: ThemeStorage,
    private fallback: ThemePreference = "dark",
  ) {
    this.value = this.initial = {
      preference: fallback,
      ready: false,
      saving: false,
      error: null,
    };
  }
  snapshot = () => this.value;
  serverSnapshot = () => this.initial;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(patch: Partial<ThemeSnapshot>) {
    const next = { ...this.value, ...patch };
    if (
      next.preference === this.value.preference &&
      next.ready === this.value.ready &&
      next.saving === this.value.saving &&
      next.error === this.value.error
    )
      return;
    this.value = next;
    this.listeners.forEach((listener) => listener());
  }
  connect = () => {
    this.connected = true;
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = this.storage.subscribe?.(this.reload);
      this.reload();
    } catch (error) {
      this.publish({ ready: true, error: asError(error) });
    }
    return () => {
      this.connected = false;
      ++this.readVersion;
      unsubscribe?.();
    };
  };
  private reload = () => {
    if (this.writes) {
      this.refreshAfterWrite = true;
      return;
    }
    const version = ++this.readVersion;
    const apply = (value: unknown) => {
      if (this.connected && version === this.readVersion)
        this.publish({
          preference: resolveThemePreference(value, this.fallback),
          ready: true,
          error: null,
        });
    };
    const fail = (error: unknown) => {
      if (this.connected && version === this.readVersion)
        this.publish({ ready: true, error: asError(error) });
    };
    try {
      const result = this.storage.read();
      if (result && typeof (result as PromiseLike<unknown>).then === "function")
        void Promise.resolve(result).then(apply, fail);
      else apply(result);
    } catch (error) {
      fail(error);
    }
  };
  setPreference = (preference: ThemePreference): Promise<boolean> => {
    const version = ++this.writeVersion;
    ++this.readVersion;
    ++this.writes;
    this.publish({ preference, ready: true, saving: true, error: null });
    const request = this.tail.then(() => this.storage.write(preference));
    this.tail = request.then(
      () => {},
      () => {},
    );
    const finish = (error: Error | null) => {
      --this.writes;
      if (version === this.writeVersion)
        this.publish({ saving: this.writes > 0, error });
      if (!this.writes && this.refreshAfterWrite) {
        this.refreshAfterWrite = false;
        if (!error && this.connected) this.reload();
      }
      return error === null;
    };
    return request.then(
      () => finish(null),
      (error) => finish(asError(error)),
    );
  };
}
