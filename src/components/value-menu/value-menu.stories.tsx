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
  { x: 0.35 + 0.06 * Math.sin(t * 0.4), y: 0.5, radius: 0.28, color: 0 },
  { x: 0.65 + 0.05 * Math.cos(t * 0.3), y: 0.45, radius: 0.3, color: 1 },
];

export const StippleBackdrop: Story = {
  decorators: [
    (Story, context) => (
      <StippleBackground
        className={styles.backdrop}
        motion={backdropMotion}
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
