import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  localStorageThemeStorage,
  type Theme,
  type ThemePreference,
  type ThemeStorage,
} from "../theme/theme-storage";
import { ThemeStore, type ThemeSnapshot } from "../theme/theme-store";

export {
  createLocalStorageThemeStorage,
  DEFAULT_THEME_STORAGE_KEY,
  localStorageThemeStorage,
  resolveThemePreference,
  type Theme,
  type ThemePreference,
  type ThemeStorage,
} from "../theme/theme-storage";

export type ThemeContextValue = ThemeSnapshot & {
  theme: Theme;
  /** Optimistically applies the preference; false means persistence failed (see error). */
  setPreference(preference: ThemePreference): Promise<boolean>;
};
const Context = createContext<ThemeContextValue | null>(null);
const systemQuery = "(prefers-color-scheme: dark)";
const systemSnapshot = () =>
  typeof window === "undefined" || !window.matchMedia
    ? true
    : window.matchMedia(systemQuery).matches;
const serverSystemSnapshot = () => true;
const subscribeSystem = (notify: () => void) => {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const media = window.matchMedia(systemQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

export type ThemeProviderProps = {
  children: ReactNode;
  storage?: ThemeStorage;
  defaultPreference?: ThemePreference;
};

/** One document-wide provider owns theme resolution; the backend only persists the preference. */
export function ThemeProvider({
  children,
  storage = localStorageThemeStorage,
  defaultPreference = "dark",
}: ThemeProviderProps) {
  const store = useMemo(
    () => new ThemeStore(storage, defaultPreference),
    [storage, defaultPreference],
  );
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.snapshot,
    store.serverSnapshot,
  );
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    systemSnapshot,
    serverSystemSnapshot,
  );
  useLayoutEffect(store.connect, [store]);
  const theme: Theme =
    snapshot.preference === "system"
      ? systemDark
        ? "dark"
        : "light"
      : snapshot.preference;

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = {
      ui: root.getAttribute("data-ui-theme"),
      legacy: root.getAttribute("data-theme"),
      scheme: root.style.colorScheme,
    };
    return () => {
      if (previous.ui === null) root.removeAttribute("data-ui-theme");
      else root.setAttribute("data-ui-theme", previous.ui);
      if (previous.legacy === null) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", previous.legacy);
      root.style.colorScheme = previous.scheme;
    };
  }, []);
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.uiTheme = theme;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);
  const value = useMemo(
    () => ({ ...snapshot, theme, setPreference: store.setPreference }),
    [snapshot, theme, store],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(Context);
  if (!value)
    throw new Error("useTheme must be used inside a Nox ThemeProvider.");
  return value;
}
