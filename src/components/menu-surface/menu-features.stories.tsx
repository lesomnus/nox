import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import {
  ActionMenu,
  ValueMenu,
  StippleBackground,
  type StippleMotion,
  type ValueOptionGroup,
} from "@lesomnus/nox";
import styles from "./menu-features.stories.module.css";

const meta = {
  title: "Menus/Features",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Detailed menu features, shown side by side from the same items and groups. Actions and values stay synchronized. Features shared by both menus appear in both examples; group-title icons, compact value styling, search, muted values and item dividers apply only to ValueMenu. See the top-level Menus Docs page for the capability table. Component pages keep their basic API and specific behavior examples.",
      },
    },
  },
  args: {
    choose: () => {},
    label: "Effort",
    value: "medium",
    disabled: false,
    options: [
      { value: "low", label: "low" },
      { value: "medium", label: "medium" },
      { value: "high", label: "high" },
    ],
  },
  render: function Interactive(args) {
    const [, updateArgs] = useArgs();
    const groups = args.groups ?? [{ label: "", items: args.options ?? [] }];
    return (
      <div className={styles.comparison}>
        <ActionMenu
          label={`${args.label} actions`}
          triggerContent="Actions"
          disabled={args.disabled}
          disabledReason={args.disabledReason}
          groups={groups.map((group) => ({
            label: group.label ?? "",
            items: group.items.map((item) => ({
              label: item.label,
              icon: item.icon,
              checked: item.value === args.value,
              disabled: item.disabled,
              run: () => updateArgs({ value: item.value }),
            })),
          }))}
        />
        <ValueMenu {...args} choose={(value) => updateArgs({ value })} />
      </div>
    );
  },
} satisfies Meta<typeof ValueMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Disabled: Story = {
  args: { disabled: true, disabledReason: "Settings require an idle session" },
};

export const Compact: Story = {
  args: { variant: "compact", minMenuWidth: 140 },
  decorators: [
    (Story) => (
      <div style={{ fontSize: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="meta-label">Effort</span>
          <Story />
        </div>
      </div>
    ),
  ],
};

const backdropMotion: StippleMotion = (t) => [
  {
    x: 0.5 + 0.34 * Math.sin(t * 1.3),
    y: 0.52 + 0.2 * Math.cos(t * 0.9),
    radius: 0.15 + 0.035 * Math.sin(t * 1.1),
    scale: [1.5, 0.65],
    rotation: t * 0.8,
    color: 0,
  },
  {
    x: 0.5 + 0.32 * Math.cos(t * 1.1 + 0.8),
    y: 0.5 + 0.22 * Math.sin(t * 1.4),
    radius: 0.14 + 0.03 * Math.cos(t * 0.7),
    scale: [0.7, 1.4],
    rotation: -t * 0.7,
    color: 1,
  },
  {
    x: 0.5 + 0.24 * Math.sin(t * 1.7 + 2.4),
    y: 0.5 + 0.18 * Math.cos(t * 1.2 + 0.9),
    radius: 0.1 + 0.025 * Math.sin(t * 1.8),
    color: 0,
  },
];

export const StippleBackdrop: Story = {
  decorators: [
    (Story, context) => (
      <StippleBackground
        className={styles.backdrop}
        motion={backdropMotion}
        speed={1}
        pattern="diamond"
        grainPx={1.5}
        scatterPx={180}
        merge={0.01}
        seed={7}
        maxFps={24}
        palette={["#3696ed", "#ed8753"]}
        backgroundColor={
          context.globals.theme === "light" ? "#dde5ee" : "#101725"
        }
      >
        <div className={styles.backdropContent}>
          <p className={styles.hint}>
            Open Effort to see the dot pattern soften through the menu's
            backdrop blur.
          </p>
          <div className={styles.menuFrame}>
            <Story />
          </div>
        </div>
      </StippleBackground>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "ValueMenu's existing translucent surface and 24px backdrop blur over a moving StippleBackground. Open the selector to compare the crisp dots outside the popup with the softened pattern behind it. No menu appearance overrides are applied.",
      },
    },
  },
};

export const Sections: Story = {
  args: {
    groups: [
      {
        label: "Quick",
        items: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
        ],
      },
      {
        label: "Deep",
        items: [
          { value: "high", label: "High" },
          { value: "maximum", label: "Maximum", separatorBefore: true },
        ],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "groups replaces the flat options list and uses the same { label, items } shape as ActionMenu. Section titles are optional; dividers separate visible sections. An item's separatorBefore adds a divider within its section. The selected value keeps its anchored row and is omitted from the remaining choices.",
      },
    },
  },
};

export const SearchableSections: Story = {
  args: { ...Sections.args, searchable: true },
  parameters: {
    docs: {
      description: {
        story:
          "Search filters choices within sections. Empty sections, their titles and orphaned dividers disappear. Arrow keys and Enter navigate/select choices, skipping titles and dividers.",
      },
    },
  },
};

export const DisabledOptions: Story = {
  args: {
    groups: [
      {
        label: "Quick",
        items: [
          { value: "low", label: "Low", disabled: true },
          { value: "balanced", label: "Balanced" },
          { value: "medium", label: "Medium" },
        ],
      },
      {
        label: "Deep",
        items: [
          { value: "high", label: "High" },
          { value: "maximum", label: "Maximum", disabled: true },
        ],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Set disabled on individual options to keep them visible but unavailable. They use the shared disabled button style and are skipped by mouse selection, arrow keys, Home/End and search Enter. The current value may also be disabled without disabling the selector itself.",
      },
    },
  },
};

export const SearchableDisabledOptions: Story = {
  args: { ...DisabledOptions.args, searchable: true },
};

function ExampleIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

const iconGroups: ValueOptionGroup[] = [
  {
    label: "Quick",
    icon: <ExampleIcon path="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
    items: [
      {
        value: "low",
        label: "Low",
        icon: (
          <ExampleIcon path="M20 4C9 3 3 8 5 15c2 7 14 5 15-11ZM4 21l10-10" />
        ),
      },
      {
        value: "medium",
        label: "Medium",
        icon: <ExampleIcon path="M4 18a9 9 0 1 1 16 0M12 14l4-6" />,
      },
    ],
  },
  {
    label: "Deep",
    icon: (
      <ExampleIcon path="m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5" />
    ),
    items: [
      {
        value: "high",
        label: "High",
        icon: (
          <ExampleIcon path="M12 3c1 7 7 6 7 12a7 7 0 0 1-14 0c0-4 4-6 7-12Z" />
        ),
      },
      {
        value: "maximum",
        label: "Maximum",
        disabled: true,
        icon: (
          <ExampleIcon path="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z" />
        ),
      },
    ],
  },
];

export const TitleIcons: Story = {
  args: {
    groups: iconGroups.map((group) => ({
      ...group,
      items: group.items.map(({ icon: _icon, ...item }) => item),
    })),
  },
};

export const ValueIcons: Story = {
  args: { groups: iconGroups.map(({ icon: _icon, ...group }) => group) },
};

export const WithIcons: Story = {
  args: { groups: iconGroups },
  parameters: {
    docs: {
      description: {
        story:
          "Both groups and options accept an optional icon (ReactNode) before their text. Option icons also appear beside the current value. Icons are decorative and do not affect accessible names or text search; disabled options retain their icon with the shared disabled styling.",
      },
    },
  },
};

export const SearchableIcons: Story = {
  args: { ...WithIcons.args, searchable: true },
};

const scrollGroups: ValueOptionGroup[] = [
  "Quick",
  "Balanced",
  "Deep",
  "Experimental",
].map((label, groupIndex) => {
  const source = iconGroups[groupIndex % iconGroups.length];
  return {
    label,
    icon: source.icon,
    items: Array.from({ length: 10 }, (_, index) => ({
      value: `preset-${groupIndex * 10 + index + 1}`,
      label: `${label} ${String(index + 1).padStart(2, "0")}`,
      icon: source.items[index % source.items.length].icon,
      disabled: index === 4,
      separatorBefore: index === 5,
    })),
  };
});

export const Scrolling: Story = {
  args: {
    label: "Preset",
    value: "preset-1",
    minMenuWidth: 240,
    groups: scrollGroups,
  },
  decorators: [
    (Story) => (
      <div className={styles.scrollExample}>
        <p className={styles.hint}>
          Open the selector and scroll through 40 presets. Arrow keys keep the
          focused preset in view.
        </p>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "40 presets across four sections, with icons, dividers and disabled options. The shared Nox ScrollArea supplies the custom handle and edge fades within the existing 240px height limit (or the available viewport space), while the current-value row stays in place. Try the mouse wheel, dragging the handle, arrow keys and Home/End.",
      },
    },
  },
};

export const SearchableScrolling: Story = {
  ...Scrolling,
  args: { ...Scrolling.args, searchable: true },
};
