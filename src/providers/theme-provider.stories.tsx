import { StrictMode, useMemo, useState, useSyncExternalStore } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  Card,
  CardActions,
  ThemeProvider,
  useTheme,
  type ThemePreference,
  type ThemeStorage,
} from "@lesomnus/nox";

function Panel() {
  const { theme, preference, setPreference, ready, saving, error } = useTheme();
  return (
    <Card
      title="Theme"
      footer={
        <CardActions>
          {(["light", "dark", "system"] as const).map((value) => (
            <Button
              key={value}
              variant={preference === value ? "solid" : "default"}
              onClick={() => void setPreference(value)}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </Button>
          ))}
        </CardActions>
      }
    >
      <p>
        Preference: <output aria-label="Theme preference">{preference}</output>
      </p>
      <p>
        Resolved: <output aria-label="Resolved theme">{theme}</output>
      </p>
      <p>
        Status:{" "}
        <output aria-label="Theme storage status">
          {!ready ? "Loading" : saving ? "Saving" : "Ready"}
        </output>
      </p>
      <label>
        <input type="checkbox" defaultChecked /> Native control color scheme
      </label>
      {error && <p role="alert">{error.message}</p>}
    </Card>
  );
}

function memoryStorage(slow = false) {
  let value: ThemePreference = "light";
  const listeners = new Set<() => void>();
  const delay = () => new Promise((resolve) => setTimeout(resolve, 150));
  const storage: ThemeStorage = {
    read() {
      const snapshot = value;
      return slow ? delay().then(() => snapshot) : snapshot;
    },
    write(next) {
      const commit = () => {
        value = next;
        listeners.forEach((f) => f());
      };
      if (slow) return delay().then(commit);
      commit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  return { storage, snapshot: () => value };
}

function Custom({ slow = false }: { slow?: boolean }) {
  const backend = useMemo(() => memoryStorage(slow), [slow]);
  const stored = useSyncExternalStore(
    backend.storage.subscribe!,
    backend.snapshot,
    backend.snapshot,
  );
  return (
    <ThemeProvider storage={backend.storage}>
      <Panel />
      <p>
        Custom backend:{" "}
        <output aria-label="Custom stored preference">{stored}</output>
      </p>
      <Button onClick={() => void backend.storage.write("light")}>
        External change
      </Button>
    </ThemeProvider>
  );
}

const meta = {
  title: "Providers/ThemeProvider",
  component: ThemeProvider,
  globals: { theme: "dark" },
  tags: ["autodocs"],
  args: { children: <Panel /> },
  decorators: [
    (Story) => (
      <div style={{ width: "min(360px, calc(100vw - 48px))" }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Document-wide light/dark/system theme, reactive useTheme hook and pluggable read/write/subscribe storage. Default: localStorage key nox.theme, dark fallback. OS changes only resolve system; the stored preference stays system. Storage errors remain available to the host while the selected theme stays usable.",
      },
    },
  },
  render: (args) => (
    <StrictMode>
      <ThemeProvider {...args} />
    </StrictMode>
  ),
} satisfies Meta<typeof ThemeProvider>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const CustomStorage: Story = { render: () => <Custom /> };
export const AsyncStorage: Story = { render: () => <Custom slow /> };
export const Unmountable: Story = {
  render: function Unmountable() {
    const [shown, show] = useState(true);
    return (
      <>
        <Button onClick={() => show(!shown)}>
          {shown ? "Unmount provider" : "Mount provider"}
        </Button>
        {shown && (
          <ThemeProvider>
            <Panel />
          </ThemeProvider>
        )}
      </>
    );
  },
};
