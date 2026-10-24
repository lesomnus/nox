export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

/** A backend may be synchronous or asynchronous. Notify after external changes. */
export interface ThemeStorage {
  read(): unknown | Promise<unknown>;
  write(preference: ThemePreference): void | Promise<void>;
  subscribe?(listener: () => void): () => void;
}

export function resolveThemePreference(
  value: unknown,
  fallback: ThemePreference = "dark",
): ThemePreference {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : fallback;
}

export const DEFAULT_THEME_STORAGE_KEY = "nox.theme";
const changeEvent = "nox:theme-storage";

/** Browser access is lazy, so creating/importing an adapter is safe during SSR. */
export function createLocalStorageThemeStorage(
  key = DEFAULT_THEME_STORAGE_KEY,
): ThemeStorage {
  return {
    read: () =>
      typeof window === "undefined" ? null : window.localStorage.getItem(key),
    write(preference) {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, preference);
      // Native storage events only reach other tabs; this also updates same-tab consumers.
      window.dispatchEvent(new CustomEvent(changeEvent, { detail: key }));
    },
    subscribe(listener) {
      if (typeof window === "undefined") return () => {};
      const external = (event: StorageEvent) => {
        if (event.key !== key && event.key !== null) return;
        try {
          if (event.storageArea === window.localStorage) listener();
        } catch {
          /* Storage access can be denied. */
        }
      };
      const local = (event: Event) => {
        if ((event as CustomEvent).detail === key) listener();
      };
      window.addEventListener("storage", external);
      window.addEventListener(changeEvent, local);
      return () => {
        window.removeEventListener("storage", external);
        window.removeEventListener(changeEvent, local);
      };
    },
  };
}

export const localStorageThemeStorage = createLocalStorageThemeStorage();
