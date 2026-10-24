# ThemeProvider

ThemeProvider owns document-wide light/dark/system resolution and exposes a
reactive `useTheme()` hook. Components still work with the default dark CSS
palette without a provider; the hook requires a provider.

```tsx
import { ThemeProvider, useTheme } from "@lesomnus/nox";

<ThemeProvider>
  <App />
</ThemeProvider>;

function Appearance() {
  const { theme, preference, setPreference } = useTheme();
  return (
    <button onClick={() => void setPreference("system")}>
      {preference} ({theme})
    </button>
  );
}
```

`preference` is `light | dark | system`; `theme` is the resolved `light | dark`.
The default preference is dark. `defaultPreference` changes the missing/invalid
storage and initial-render fallback. System mode follows OS changes, including
changes while the page is open, without writing a resolved value to storage.

The provider synchronizes `data-ui-theme`, the compatible `data-theme` attribute,
and the native `color-scheme` on document.documentElement. Menus/dialogs portaled
to body share the same CSS tokens. Use one provider per document. Unmount restores
the previous root attributes and inline color scheme and removes subscriptions.

## Storage

The default adapter stores the plain preference string in localStorage under
`nox.theme`. This is separate from an application's settings document. Writes
notify same-tab adapters, and native storage events synchronize other tabs.
Clearing/removing the key restores the default preference. To namespace the key:

```tsx
const storage = createLocalStorageThemeStorage("my-app.theme");
<ThemeProvider storage={storage}>
  <App />
</ThemeProvider>;
```

Inject any backend implementing `ThemeStorage`:

```ts
interface ThemeStorage {
  read(): unknown | Promise<unknown>;
  write(preference: ThemePreference): void | Promise<void>;
  subscribe?(listener: () => void): () => void;
}
```

`read` returns a preference, null/undefined for missing data, or an invalid value
which falls back to defaultPreference. A notification rereads the backend; it
does not write the value back. Keep adapter identity stable (module constant or
useMemo), and return an unsubscribe function when implementing subscriptions.
Both asynchronous server backends and synchronous stores work. The backend owns
its format, transport and notifications; Nox owns theme state and OS tracking.

```tsx
const storage: ThemeStorage = {
  read: () => settings.theme,
  write: (preference) => settings.setTheme(preference),
  subscribe: (notify) => settings.subscribe(notify),
};
<ThemeProvider storage={storage}>
  <App />
</ThemeProvider>;
```

cxz injects an adapter to its existing SettingsStore. Its value remains
`ui.theme` in the JSON document at localStorage key `settings`; unrelated settings
and existing cross-tab synchronization are preserved. It does not migrate or
duplicate the setting into nox.theme.

## Async state and errors

The hook also exposes `ready`, `saving`, and `error: Error | null`.
setPreference applies immediately and resolves to a success boolean after
persistence. Failed or denied storage keeps the in-memory theme usable and
exposes the error; it does not cause an unhandled rejection or claim success.
The host chooses how to display/retry failures.

Writes are ordered, and stale async reads cannot overwrite a newer selection.
Storage is not accessed while importing or server-rendering the provider.
SSR uses defaultPreference (system resolves to dark) until client initialization;
an asynchronous backend shows that fallback until its read completes. Backend
writes already requested may finish after unmount, but disconnected reads are
ignored and no React subscriber remains.

Monaco and other non-CSS renderers can consume useTheme().theme explicitly.
UIProvider remains the separate localization provider.

See **Providers/ThemeProvider** for default localStorage, custom in-memory storage,
asynchronous storage and cleanup examples.
