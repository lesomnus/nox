import { describe, expect, it } from "vitest";
import { ThemeStore } from "./theme-store";
import type { ThemePreference, ThemeStorage } from "./theme-storage";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const flush = async () => {
  for (let i = 0; i < 6; ++i) await Promise.resolve();
};

function memory(initial: unknown = null) {
  let value = initial;
  const listeners = new Set<() => void>();
  const storage: ThemeStorage = {
    read: () => value,
    write(next) {
      value = next;
      listeners.forEach((f) => f());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  return {
    storage,
    change(next: unknown) {
      value = next;
      listeners.forEach((f) => f());
    },
    listeners,
  };
}

describe("ThemeStore", () => {
  it("reads, persists preferences and follows external changes without rewriting them", async () => {
    const backend = memory("light");
    const store = new ThemeStore(backend.storage);
    const stop = store.connect();
    expect(store.snapshot()).toMatchObject({
      preference: "light",
      ready: true,
    });
    expect(await store.setPreference("system")).toBe(true);
    expect(backend.storage.read()).toBe("system");
    backend.change("dark");
    expect(store.snapshot().preference).toBe("dark");
    backend.change("invalid");
    expect(store.snapshot().preference).toBe("dark");
    stop();
    expect(backend.listeners.size).toBe(0);
  });
  it("uses the chosen default for missing or invalid data and keeps snapshots stable", () => {
    const backend = memory();
    const store = new ThemeStore(backend.storage, "system");
    const stop = store.connect();
    expect(store.snapshot().preference).toBe("system");
    const snapshot = store.snapshot();
    backend.change("invalid");
    expect(store.snapshot()).toBe(snapshot);
    stop();
  });
  it("does not overwrite a user edit with a late initial read", async () => {
    const read = deferred<unknown>();
    const store = new ThemeStore({ read: () => read.promise, write() {} });
    const stop = store.connect();
    expect(store.snapshot().ready).toBe(false);
    await store.setPreference("light");
    read.resolve("dark");
    await flush();
    expect(store.snapshot()).toMatchObject({
      preference: "light",
      ready: true,
      saving: false,
    });
    stop();
  });
  it("serializes slow writes so the latest selection wins in the backend too", async () => {
    const first = deferred<void>();
    const writes: ThemePreference[] = [];
    const store = new ThemeStore({
      read: () => null,
      write(value) {
        writes.push(value);
        return writes.length === 1 ? first.promise : undefined;
      },
    });
    const stop = store.connect();
    const a = store.setPreference("light");
    const b = store.setPreference("system");
    await flush();
    expect(writes).toEqual(["light"]);
    expect(store.snapshot()).toMatchObject({
      preference: "system",
      saving: true,
    });
    first.resolve();
    expect(await a).toBe(true);
    expect(await b).toBe(true);
    expect(writes).toEqual(["light", "system"]);
    expect(store.snapshot().saving).toBe(false);
    stop();
  });
  it("retains the usable in-memory preference and exposes backend errors", async () => {
    const denied = new Error("Storage denied");
    const store = new ThemeStore({
      read() {
        throw denied;
      },
      write() {
        throw denied;
      },
    });
    const stop = store.connect();
    expect(store.snapshot()).toMatchObject({ ready: true, error: denied });
    expect(await store.setPreference("light")).toBe(false);
    expect(store.snapshot()).toMatchObject({
      preference: "light",
      saving: false,
      error: denied,
    });
    stop();
  });
  it("ignores disconnected reads and tolerates StrictMode reconnect", async () => {
    const old = deferred<unknown>();
    let calls = 0;
    const store = new ThemeStore({
      read: () => (++calls === 1 ? old.promise : "light"),
      write() {},
    });
    store.connect()();
    const stop = store.connect();
    old.resolve("dark");
    await flush();
    expect(store.snapshot().preference).toBe("light");
    stop();
  });
});
