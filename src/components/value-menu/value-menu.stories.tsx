import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import {
  ValueMenu,
  StippleBackground,
  type StippleMotion,
} from "@lesomnus/nox";
import styles from "./value-menu.stories.module.css";

const meta = {
  title: "Components/ValueMenu",
  component: ValueMenu,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A value selector (combobox/listbox). The selected row overlays the trigger text in place, followed by a divider and other choices. This is a separate component from ActionMenu, whose popup sits beside its trigger and contains actions or checked choices. The compact variant only changes spacing.",
      },
    },
  },
  args: {
    choose: () => {},
    label: "Effort",
    value: "medium",
    disabled: false,
    options: [
      { value: "default", label: "medium", muted: true },
      { value: "low", label: "low" },
      { value: "medium", label: "medium" },
      { value: "high", label: "high" },
    ],
  },
  render: function Interactive(args) {
    const [, updateArgs] = useArgs();
    return <ValueMenu {...args} choose={(value) => updateArgs({ value })} />;
  },
} satisfies Meta<typeof ValueMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Inherited: Story = { args: { value: "default" } };
export const Disabled: Story = {
  args: { disabled: true, disabledReason: "Settings require an idle session" },
};

export const ComposerValue: Story = {
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

export const Separators: Story = {
  args: {
    value: "low",
    options: [
      { value: "default", label: "Project default", muted: true },
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High", separatorBefore: true },
      { value: "maximum", label: "Maximum" },
    ],
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

export const EmptySections: Story = {
  args: {
    groups: [
      { label: "Current", items: [{ value: "medium", label: "Medium" }] },
      { label: "Empty", items: [] },
      {
        label: "Remaining",
        items: [{ value: "high", label: "High", separatorBefore: true }],
      },
    ],
  },
};
