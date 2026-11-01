import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  CardStack,
  CompactNumber,
  type CardStackProps,
} from "@lesomnus/nox";
import guide from "../../../docs/card-stack.md?raw";
import styles from "./card-stack.stories.module.css";

type Item = { id: string; title: string; text: string };
type Args = {
  visibleCount: number;
  initialCount: number;
  controlled: boolean;
  longContent: boolean;
  bodyPortal: boolean;
  underlay: boolean;
};
const keyOf = (item: Item) => item.id;
const makeItem = (number: number): Item => ({
  id: String(number),
  title: `Queued card ${number}`,
  text: `Card ${number} keeps its complete body while other cards move in front of it.`,
});
function Example({
  visibleCount = 3,
  initialCount = 5,
  controlled = false,
  longContent = false,
  bodyPortal = false,
  underlay = false,
}: Args) {
  const [items, setItems] = useState(() =>
    Array.from({ length: initialCount }, (_, i) => makeItem(i + 1)),
  );
  const sequence = useRef(initialCount);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(controlled);
  const trigger = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  const entry = useRef<HTMLTextAreaElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const show = () => {
    if (controlled) return;
    window.clearTimeout(timer.current);
    setOpen(true);
  };
  const close = () => {
    if (controlled) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (
        !trigger.current?.matches(":hover") &&
        !stack.current?.matches(":hover") &&
        !trigger.current?.querySelector(":focus-visible") &&
        !stack.current?.querySelector(":focus-visible")
      )
        setOpen(false);
    }, 60);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const focus = () => {
    if (document.activeElement?.matches(":focus-visible")) show();
  };
  const props: CardStackProps<Item> = {
    items,
    getKey: keyOf,
    open,
    anchor: trigger.current,
    container: bodyPortal ? undefined : container,
    occlusionBoundary: dock.current,
    exitTarget: entry.current,
    visibleCount,
    scrollbarLabel: "Queued card content",
    getItemProps: (item) =>
      ({
        role: "region",
        "aria-label": item.title,
        "data-demo-id": item.id,
      }) as HTMLAttributes<HTMLDivElement>,
    renderItem: (item) => (
      <div className={styles.body}>
        <strong>{item.title}</strong>
        <p>{item.text}</p>
        <pre>
          {longContent
            ? Array.from(
                { length: 80 },
                (_, i) => `line ${i + 1}: the viewport owns scrolling`,
              ).join("\n")
            : `process item-${item.id}`}
        </pre>
      </div>
    ),
  };
  return (
    <section ref={setContainer} className={styles.stage}>
      <header className={styles.header}>
        <div className={styles.actions}>
          <Button
            onClick={() =>
              setItems((old) => [...old, makeItem(++sequence.current)])
            }
          >
            Add card
          </Button>
          <Button onClick={() => setItems([])}>Clear queue</Button>
          {controlled && (
            <Button onClick={() => setOpen((value) => !value)}>
              Toggle stack
            </Button>
          )}
        </div>
        <p>
          Hover or focus the queue controls. Process next to advance and refill;
          move away to dismiss from the back.
        </p>
      </header>
      <div className={styles.canvas}>
        {Array.from({ length: 5 }, (_, i) => (
          <p key={i}>
            The stack floats above this content. Background blur stays visible
            without darkening as the queue grows.
          </p>
        ))}
      </div>
      {underlay && (
        <aside className={styles.underlay}>
          Another persistent card remains underneath while the queue departs.
        </aside>
      )}
      <div ref={dock} className={styles.dock}>
        <div
          ref={trigger}
          className={styles.trigger}
          aria-label="Queue controls"
          role="group"
          onPointerEnter={show}
          onPointerLeave={close}
          onFocusCapture={focus}
          onBlurCapture={close}
        >
          <CompactNumber
            className={styles.count}
            value={items.length}
            mode="integer"
            digits={3}
            label={`${items.length} queued cards`}
          />
          <Button
            disabled={!items.length}
            onClick={() => setItems((old) => old.slice(1))}
          >
            Process next
          </Button>
        </div>
        <textarea
          ref={entry}
          className={styles.entry}
          aria-label="Example text input"
          placeholder="Cards disappear behind this surface."
        />
      </div>
      <CardStack
        {...props}
        ref={stack}
        onPointerEnter={show}
        onPointerLeave={close}
        onFocusCapture={focus}
        onBlurCapture={close}
      />
    </section>
  );
}
const meta: Meta<Args> = {
  title: "Components/CardStack",
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: guide } },
  },
  args: {
    visibleCount: 3,
    initialCount: 5,
    controlled: false,
    longContent: false,
    bodyPortal: false,
    underlay: false,
  },
  argTypes: {
    visibleCount: { control: { type: "number", min: 1, max: 8 } },
    initialCount: { control: { type: "number", min: 0, max: 20 } },
  },
  render: (args) => <Example {...args} />,
};
export default meta;
type Story = StoryObj<typeof meta>;
export const Queue: Story = {};
export const LongContent: Story = {
  args: { longContent: true, controlled: true },
};
export const MoreVisibleCards: Story = {
  args: { visibleCount: 5, initialCount: 9, controlled: true },
};
export const AboveAnotherCard: Story = { args: { underlay: true } };
export const BodyPortal: Story = {
  args: { bodyPortal: true, controlled: true },
};
export const Empty: Story = { args: { initialCount: 0 } };
export const PrimitiveItems: Story = {
  render: function Numbers() {
    const [items, setItems] = useState([0, 1, 2, 3]);
    const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
    return (
      <div className={styles.primitive}>
        <button ref={setAnchor} onClick={() => setItems((old) => old.slice(1))}>
          Next number
        </button>
        <CardStack
          items={items}
          getKey={String}
          open
          anchor={anchor}
          getItemProps={(item) => ({
            role: "region",
            "aria-label": `Number ${item}`,
          })}
          renderItem={(item) => <p>Number {item}</p>}
        />
      </div>
    );
  },
};
