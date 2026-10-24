import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ActionMenu,
  Button,
  ConfirmationDialog,
  IconValueMenu,
  ValueMenu,
  type ActionMenuItem,
} from "@lesomnus/nox";
import styles from "./menu-surface.stories.module.css";
import menuGuide from "../../../docs/menu-surface.md?raw";

const meta = {
  title: "Menus",
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component: menuGuide,
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function MenuIcon({ path }: { path: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

const paths = {
  info: "M12 11v6m0-10h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  restart: "M3 10a9 9 0 1 1 2 8M3 4v6h6",
  stop: "M6 6h12v12H6Z",
  terminal: "m4 6 5 6-5 6m8 0h8",
  quick: "m13 2-9 12h7l-1 8 10-13h-7l1-7Z",
  deep: "m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5",
};

const effortOptions = ["low", "medium", "high"].map((value) => ({
  value,
  label: value,
}));
const basicActions: ActionMenuItem[] = [
  { label: "Details", run: () => {} },
  { label: "Restart", run: () => {} },
  { label: "Stop", danger: true, run: () => {} },
];

export const Overview: Story = {
  render: function Overview() {
    const [effort, setEffort] = useState("medium");
    return (
      <div className={`${styles.row} ${styles.mono}`}>
        <ActionMenu
          label="Actions"
          triggerContent="Actions"
          items={basicActions}
        />
        <ValueMenu
          label="Effort"
          value={effort}
          choose={setEffort}
          options={effortOptions}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "The same MenuSurface in both menus. Switch the Storybook theme to compare foreground, background, frame and inherited trigger typography. Actions open beside the trigger; the current value overlays its original text position.",
      },
    },
  },
};

export const GroupsAndIcons: Story = {
  render: function GroupsAndIcons() {
    const [lastAction, setLastAction] = useState("No action yet");
    const [effort, setEffort] = useState("medium");
    const action = (label: string, path: string): ActionMenuItem => ({
      label,
      icon: <MenuIcon path={path} />,
      run: () => setLastAction(label),
    });
    return (
      <div className={styles.example}>
        <p className={styles.hint}>
          Both menus accept groups and item icons. ValueMenu also supports
          group-title icons.
        </p>
        <div className={styles.row}>
          <ActionMenu
            label="Grouped actions"
            triggerContent="Actions"
            groups={[
              {
                label: "Session",
                items: [
                  action("Restart", paths.restart),
                  action("Stop", paths.stop),
                ],
              },
              { label: "Information", items: [action("Details", paths.info)] },
            ]}
          />
          <ValueMenu
            label="Grouped effort"
            value={effort}
            choose={setEffort}
            groups={[
              {
                label: "Quick",
                icon: <MenuIcon path={paths.quick} />,
                items: effortOptions.slice(0, 2).map((item) => ({
                  ...item,
                  icon: <MenuIcon path={paths.quick} />,
                })),
              },
              {
                label: "Deep",
                icon: <MenuIcon path={paths.deep} />,
                items: [
                  {
                    value: "high",
                    label: "high",
                    icon: <MenuIcon path={paths.deep} />,
                  },
                ],
              },
            ]}
          />
        </div>
        <output className={styles.feedback} aria-label="Last action">
          {lastAction}
        </output>
      </div>
    );
  },
};

export const StatesAndShortcuts: Story = {
  render: function StatesAndShortcuts() {
    const [checked, setChecked] = useState(true);
    const [value, setValue] = useState("default");
    const [lastAction, setLastAction] = useState("No action yet");
    return (
      <div className={styles.example}>
        <p className={styles.hint}>
          Checked, disabled and dangerous actions, shortcut keycaps and a status
          footer. The value selector shows a muted default and a disabled
          choice.
        </p>
        <div className={styles.row}>
          <ActionMenu
            label="Action states"
            triggerContent="Actions"
            status="Shortcuts are labels; the host handles their keys."
            groups={[
              {
                label: "View",
                items: [
                  {
                    label: "Show stopped",
                    checked,
                    run: () => setChecked(!checked),
                  },
                  {
                    label: "Terminal",
                    icon: <MenuIcon path={paths.terminal} />,
                    shortcut: ["Ctrl", "`"],
                    run: () => setLastAction("Terminal"),
                  },
                ],
              },
              {
                label: "Session",
                items: [
                  {
                    label: "Restart",
                    disabled: true,
                    run: () => setLastAction("Restart"),
                  },
                  {
                    label: "Stop",
                    danger: true,
                    icon: <MenuIcon path={paths.stop} />,
                    run: () => setLastAction("Stop"),
                  },
                ],
              },
            ]}
          />
          <ValueMenu
            label="Value states"
            value={value}
            choose={setValue}
            options={[
              { value: "default", label: "medium", muted: true },
              ...effortOptions.map((item) => ({
                ...item,
                disabled: item.value === "high",
              })),
            ]}
          />
          <ActionMenu
            label="Unavailable actions"
            disabled
            disabledReason="Unavailable while working"
          />
        </div>
        <output className={styles.feedback} aria-label="Last action">
          {lastAction}
        </output>
      </div>
    );
  },
};

export const SearchAndScrolling: Story = {
  render: function SearchAndScrolling() {
    const [value, setValue] = useState("preset-1");
    const [lastAction, setLastAction] = useState("No preset applied");
    const groups = ["Quick", "Balanced", "Deep", "Experimental"].map(
      (label, group) => ({
        label,
        items: Array.from({ length: 10 }, (_, index) => ({
          value: `preset-${group * 10 + index + 1}`,
          label: `${label} ${String(index + 1).padStart(2, "0")}`,
          icon: <MenuIcon path={group < 2 ? paths.quick : paths.deep} />,
          disabled: index === 4,
          separatorBefore: index === 5,
        })),
      }),
    );
    return (
      <div className={styles.example}>
        <p className={styles.hint}>
          Forty entries in each menu. ActionMenu scrolls natively. ValueMenu
          adds search, item dividers and ScrollArea while keeping the current
          row anchored.
        </p>
        <div className={styles.row}>
          <ActionMenu
            label="Preset actions"
            triggerContent="Apply preset"
            groups={groups.map((group) => ({
              label: group.label,
              items: group.items.map((item) => ({
                ...item,
                run: () => setLastAction(item.label),
              })),
            }))}
          />
          <ValueMenu
            label="Preset"
            value={value}
            choose={setValue}
            groups={groups}
            searchable
          />
        </div>
        <output className={styles.feedback} aria-label="Last action">
          {lastAction}
        </output>
      </div>
    );
  },
};

export const PlacementAndMotion: Story = {
  render: () => (
    <div className={`${styles.example} ${styles.placement}`}>
      <p className={styles.hint}>
        Placement and entrance direction are independent. Menus stay within the
        viewport; ValueMenu handles its own current-text alignment.
      </p>
      <div className={styles.row}>
        <ActionMenu
          label="Below"
          triggerContent="Below"
          items={basicActions}
          motion="from-top"
        />
        <ActionMenu
          label="Above"
          triggerContent="Above"
          items={basicActions}
          placement="above"
          motion="from-bottom"
        />
        <ActionMenu
          label="Beside"
          triggerContent="Beside"
          items={basicActions}
          placement="right"
          motion={{ from: "left", effect: "slide" }}
        />
        <ActionMenu
          label="Reveal"
          triggerContent="Reveal"
          items={basicActions}
          placement="right"
          motion={{ from: "top-left", effect: "reveal" }}
        />
        <ActionMenu
          label="Custom origin"
          triggerContent="Custom origin"
          items={basicActions}
          position={(rect) => ({ left: rect.right, top: rect.top })}
        />
      </div>
    </div>
  ),
};

export const TriggerVariants: Story = {
  render: function TriggerVariants() {
    const [value, setValue] = useState("medium");
    const common = { value, choose: setValue, options: effortOptions };
    return (
      <div className={styles.example}>
        <p className={styles.hint}>
          Ellipsis, text and icon action triggers; default, compact and
          icon-grouped value selectors. The value examples share state.
        </p>
        <div className={styles.row}>
          <ActionMenu label="More actions" items={basicActions} />
          <ActionMenu
            label="Text actions"
            triggerContent="Actions"
            items={basicActions}
          />
          <ActionMenu
            label="Terminal actions"
            triggerContent={<MenuIcon path={paths.terminal} />}
            items={basicActions}
          />
          <ValueMenu {...common} label="Default effort" />
          <ValueMenu {...common} label="Compact effort" variant="compact" />
          <IconValueMenu
            {...common}
            label="Icon effort"
            icon={<MenuIcon path={paths.quick} />}
          />
        </div>
      </div>
    );
  },
};

export const BackdropAndTypography: Story = {
  render: function BackdropAndTypography() {
    const [value, setValue] = useState("medium");
    return (
      <div className={styles.backdrop}>
        <p>
          Open a menu over the dots. The background softens, and the popup keeps
          its trigger's font.
        </p>
        <div className={styles.row}>
          <ActionMenu
            label="Appearance actions"
            triggerContent="Actions"
            items={basicActions}
          />
          <ValueMenu
            label="Appearance effort"
            value={value}
            choose={setValue}
            options={effortOptions}
          />
        </div>
        <p>The same surface and tokens follow the selected Storybook theme.</p>
      </div>
    );
  },
};

export const InsideDialog: Story = {
  render: function InsideDialog() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("medium");
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        {open && (
          <ConfirmationDialog
            title="Menu overlays inside dialogs"
            confirmLabel="Done"
            execute={() => true}
            close={() => setOpen(false)}
          >
            <div className={styles.example}>
              <p className={styles.hint}>
                MenuSurface portals into the nearest open native dialog, so both
                menus stay in its top layer and remain interactive.
              </p>
              <div className={styles.row}>
                <ActionMenu
                  label="Dialog actions"
                  triggerContent="Actions"
                  items={basicActions}
                />
                <ValueMenu
                  label="Dialog effort"
                  value={value}
                  choose={setValue}
                  options={effortOptions}
                />
              </div>
            </div>
          </ConfirmationDialog>
        )}
      </>
    );
  },
};
