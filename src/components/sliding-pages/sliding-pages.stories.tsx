import { StrictMode, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  SlidingPage,
  SlidingPages,
  type SlidingPagesProps,
} from "@lesomnus/nox";
import guide from "../../../docs/sliding-pages.md?raw";
import styles from "./sliding-pages.stories.module.css";

const steps = ["profile", "workspace", "review"];
function Example(args: SlidingPagesProps) {
  const [value, setValue] = useState(args.value);
  const [extra, setExtra] = useState(false);
  const index = steps.indexOf(value);
  return (
    <section className={styles.stage}>
      <nav className={styles.steps} aria-label="Example pages">
        {steps.map((step, i) => (
          <Button
            key={step}
            aria-current={step === value ? "step" : undefined}
            onClick={() => setValue(step)}
          >
            {i + 1}. {step}
          </Button>
        ))}
      </nav>
      <SlidingPages {...args} value={value} className={styles.viewport}>
        <SlidingPage
          value="profile"
          aria-label="Profile"
          className={styles.page}
          style={args.resize === "both" ? { width: 300 } : undefined}
        >
          <h2>Your profile</h2>
          <p>
            The viewport stays in place while its pages move. This input remains
            mounted when you leave.
          </p>
          <label className={styles.field}>
            Display name
            <input name="displayName" placeholder="Your name" />
          </label>
        </SlidingPage>
        <SlidingPage
          value="workspace"
          aria-label="Workspace"
          className={styles.page}
          style={args.resize === "both" ? { width: 460 } : undefined}
        >
          <h2>Workspace preferences</h2>
          <p>
            A larger page can change the viewport height, or both dimensions.
            The content is measured again when it changes.
          </p>
          <label className={styles.field}>
            Workspace name
            <input placeholder="My workspace" />
          </label>
          <label className={styles.field}>
            Description
            <textarea rows={3} placeholder="What will you work on?" />
          </label>
          <Button onClick={() => setExtra((current) => !current)}>
            Toggle extra details
          </Button>
          {extra && (
            <p className={styles.extra}>
              Extra content grows the active page without starting another
              navigation. ResizeObserver follows asynchronous content and line
              wrapping too.
            </p>
          )}
        </SlidingPage>
        <SlidingPage
          value="review"
          aria-label="Review"
          className={styles.page}
          style={args.resize === "both" ? { width: 360 } : undefined}
        >
          <h2>Ready to continue</h2>
          <p>
            Go back to check that the profile input still contains your draft.
          </p>
          <p>
            Inactive pages stay out of keyboard and screen-reader navigation.
            External controls keep their focus.
          </p>
        </SlidingPage>
      </SlidingPages>
      <footer className={styles.controls}>
        <Button
          disabled={index <= 0}
          onClick={() => setValue(steps[index - 1])}
        >
          Back
        </Button>
        <output aria-label="Current page">
          {index + 1} / {steps.length}
        </output>
        <Button
          disabled={index >= steps.length - 1}
          onClick={() => setValue(steps[index + 1])}
        >
          Next
        </Button>
      </footer>
    </section>
  );
}

function FormExample() {
  const [value, setValue] = useState("profile");
  const [submitted, setSubmitted] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const workspace = useRef<HTMLInputElement>(null);
  const next = (target: string) => {
    const page = form.current!.querySelector("[data-active]")!;
    const fields = page.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >("input, textarea");
    if ([...fields].every((field) => field.reportValidity())) setValue(target);
  };
  return (
    <form
      ref={form}
      className={styles.stage}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (value !== "review") {
          next(value === "profile" ? "workspace" : "review");
          return;
        }
        setSubmitted(
          JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
        );
      }}
    >
      <output className={styles.progress} aria-live="polite">
        Step {steps.indexOf(value) + 1} of {steps.length}
      </output>
      <SlidingPages
        value={value}
        resize="height"
        className={styles.viewport}
        aria-label="Create a workspace"
      >
        <SlidingPage
          value="profile"
          aria-label="Profile"
          className={styles.page}
        >
          <h2>Tell us about yourself</h2>
          <label className={styles.field}>
            Name
            <input name="name" required />
          </label>
          <label className={styles.field}>
            Email
            <input name="email" type="email" required />
          </label>
          <div className={styles.actions}>
            <Button type="button" onClick={() => next("workspace")}>
              Next
            </Button>
          </div>
        </SlidingPage>
        <SlidingPage
          value="workspace"
          aria-label="Workspace"
          initialFocus={workspace}
          className={styles.page}
        >
          <h2>Name your workspace</h2>
          <p>
            Your previous answers stay in the form while this page is active.
          </p>
          <label className={styles.field}>
            Workspace
            <input ref={workspace} name="workspace" required />
          </label>
          <label className={styles.field}>
            Notes
            <textarea name="notes" rows={3} />
          </label>
          <div className={styles.actions}>
            <Button type="button" onClick={() => setValue("profile")}>
              Back
            </Button>
            <Button type="button" onClick={() => next("review")}>
              Next
            </Button>
          </div>
        </SlidingPage>
        <SlidingPage value="review" aria-label="Review" className={styles.page}>
          <h2>Everything is ready</h2>
          <p>
            Submitting reads all pages from one FormData, including fields on
            inactive pages. Validation and submission belong to this example.
          </p>
          <div className={styles.actions}>
            <Button type="button" onClick={() => setValue("workspace")}>
              Back
            </Button>
            <Button type="submit">Create workspace</Button>
          </div>
        </SlidingPage>
      </SlidingPages>
      <output className={styles.result} aria-label="Submitted form">
        {submitted || "No submission"}
      </output>
    </form>
  );
}

const meta = {
  title: "Components/SlidingPages",
  component: SlidingPages,
  tags: ["autodocs"],
  args: {
    value: "profile",
    resize: "none",
    orientation: "horizontal",
    style: { height: 360 },
    children: [],
  },
  argTypes: {
    value: { control: false },
    children: { control: false },
    resize: { control: "select", options: ["none", "height", "both"] },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
  parameters: { layout: "padded", docs: { description: { component: guide } } },
  render: (args) => <Example {...args} />,
} satisfies Meta<typeof SlidingPages>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FixedViewport: Story = {};
export const AutoHeight: Story = { args: { resize: "height", style: {} } };
export const AutoSize: Story = { args: { resize: "both", style: {} } };
export const Vertical: Story = { args: { orientation: "vertical" } };
export const RightToLeft: Story = { args: { dir: "rtl" } };
export const MultiStepForm: Story = { render: () => <FormExample /> };
export const StrictLifecycle: Story = {
  args: { resize: "height", style: {} },
  render: (args) => (
    <StrictMode>
      <Example {...args} />
    </StrictMode>
  ),
};
