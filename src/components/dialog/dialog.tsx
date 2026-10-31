import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type Dispatch,
  type RefObject,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import {
  DialogSurface,
  dialogClassName,
} from "../dialog-surface/dialog-surface";
import styles from "./dialog.module.css";

type DialogLabels = {
  setTitle: Dispatch<SetStateAction<string | undefined>>;
  setDescription: Dispatch<SetStateAction<string | undefined>>;
};
const Labels = createContext<DialogLabels | undefined>(undefined);

export type DialogProps = Omit<
  ComponentProps<"dialog">,
  "open" | "onClose" | "title"
> & {
  open: boolean;
  /** Requests that the host set open=false; controlled updates do not call this. */
  onClose: () => void;
  /** Called after a controlled close finishes and focus returns to the opener. */
  onClosed?: () => void;
  /** Allow Escape and backdrop dismissal. Business policy belongs to the caller. */
  dismissible?: boolean;
  initialFocus?: RefObject<HTMLElement | null>;
  /** Use the standard Card frame; false when children supply their own Card. */
  frame?: boolean;
  /** Keep surface motion anchored to its upper-left corner. */
  anchored?: boolean;
  /** Noninteractive decoration outside the animated surface, such as DialogTrigger. */
  decoration?: ReactNode;
};

/** A controlled native modal boundary. Content, actions and async work belong to the host. */
export function Dialog({
  open,
  onClose,
  onClosed,
  dismissible = true,
  initialFocus,
  frame = true,
  anchored = false,
  decoration,
  children,
  className = "",
  ref,
  onCancel,
  onClick,
  onPointerDown,
  onKeyDown,
  ...props
}: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const outside = useRef(false);
  const lifecycle = useRef(0);
  const [present, setPresent] = useState(open);
  const visible = open || present;
  const [title, setTitle] = useState<string>();
  const [description, setDescription] = useState<string>();
  const latest = useRef({ open, initialFocus, onClosed });
  useLayoutEffect(() => {
    latest.current = { open, initialFocus, onClosed };
  });
  useLayoutEffect(() => {
    if (!visible || !dialog.current) return;
    const generation = ++lifecycle.current;
    const node = dialog.current;
    const origin =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : undefined;
    // Resolve composed labels before showModal moves focus and announces the dialog.
    // Child registration keeps subsequent conditional Title/Description changes in sync.
    for (const [attribute, selector] of [
      ["aria-labelledby", "[data-dialog-title]"],
      ["aria-describedby", "[data-dialog-description]"],
    ]) {
      if (
        node.hasAttribute(attribute) ||
        (attribute === "aria-labelledby" && node.hasAttribute("aria-label"))
      )
        continue;
      const label = node.querySelector<HTMLElement>(selector);
      if (label?.id) node.setAttribute(attribute, label.id);
    }
    node.showModal();
    const target = latest.current.initialFocus?.current;
    if (target && node.contains(target)) target.focus({ preventScroll: true });
    return () => {
      node.close();
      // StrictMode can attach the same modal again before this microtask runs.
      queueMicrotask(() => {
        if (lifecycle.current !== generation) return;
        if (origin?.isConnected) origin.focus({ preventScroll: true });
        if (!latest.current.open) latest.current.onClosed?.();
      });
    };
  }, [visible]);
  useLayoutEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }
    if (!present) return;
    let canceled = false;
    // Only wait for the surface and native backdrop, never caller-owned content
    // such as a looping progress animation. Reduced motion has no animations.
    // Native ::backdrop animations are only included with subtree=true.
    const animations = dialog
      .current!.getAnimations({ subtree: true })
      .filter((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target;
        return target === dialog.current || target === surface.current;
      });
    void Promise.all(
      animations.map((animation) => animation.finished.catch(() => {})),
    ).then(() => {
      if (!canceled) setPresent(false);
    });
    return () => {
      canceled = true;
    };
  }, [open, present]);
  if (!visible) return null;
  return createPortal(
    <dialog
      {...props}
      ref={(node) => {
        dialog.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
      tabIndex={-1}
      data-closing={!open}
      aria-hidden={!open || props["aria-hidden"]}
      inert={!open || props.inert}
      className={`${dialogClassName} ${styles.dialog} dialog ${className}`}
      aria-labelledby={
        props["aria-labelledby"] ?? (props["aria-label"] ? undefined : title)
      }
      aria-describedby={props["aria-describedby"] ?? description}
      onClose={(event) => {
        // Also synchronize native dialog.close()/form method=dialog with the host.
        // Ignore close events from StrictMode cleanup followed by reopening.
        if (
          event.currentTarget.isConnected &&
          !event.currentTarget.open &&
          open
        )
          onClose();
      }}
      onCancel={(event) => {
        onCancel?.(event);
        const canceled = event.defaultPrevented;
        event.preventDefault();
        if (!canceled && dismissible && open) onClose();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        outside.current =
          !event.defaultPrevented &&
          open &&
          event.target === event.currentTarget &&
          beyond(event.currentTarget, event.clientX, event.clientY);
      }}
      onClick={(event) => {
        onClick?.(event);
        const dismiss = outside.current;
        outside.current = false;
        if (
          !event.defaultPrevented &&
          dismissible &&
          dismiss &&
          event.target === event.currentTarget &&
          beyond(event.currentTarget, event.clientX, event.clientY)
        )
          onClose();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        event.stopPropagation();
        if (event.defaultPrevented || event.key !== "Tab") return;
        const nodes = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex], [contenteditable="true"]',
          ),
        ).filter(
          (node) =>
            (node.tabIndex >= 0 ||
              (node.isContentEditable && !node.hasAttribute("tabindex"))) &&
            node.getClientRects().length &&
            !node.closest("[inert]") &&
            getComputedStyle(node).visibility !== "hidden",
        );
        const first = nodes[0],
          last = nodes.at(-1);
        const current = document.activeElement;
        if (
          !first ||
          current === event.currentTarget ||
          (event.shiftKey ? current === first : current === last)
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus({ preventScroll: true });
          if (!first) event.currentTarget.focus({ preventScroll: true });
        }
      }}
    >
      <Labels.Provider value={{ setTitle, setDescription }}>
        {decoration}
        <DialogSurface ref={surface} closing={!open} anchored={anchored}>
          {frame ? (
            <div className={`${styles.content} floating-card`}>{children}</div>
          ) : (
            children
          )}
        </DialogSurface>
      </Labels.Provider>
    </dialog>,
    document.body,
  );
}

function beyond(node: HTMLElement, x: number, y: number) {
  const box = node.getBoundingClientRect();
  return x < box.left || x > box.right || y < box.top || y > box.bottom;
}

export function DialogHeader({
  className = "",
  ...props
}: ComponentProps<"header">) {
  return (
    <header
      {...props}
      className={`${styles.header} dialog-header card-heading ${className}`}
    />
  );
}

export function DialogBody({
  className = "",
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={`${styles.body} dialog-body card-body ${className}`}
    />
  );
}

export function DialogFooter({
  className = "",
  ...props
}: ComponentProps<"footer">) {
  return (
    <footer
      {...props}
      className={`${styles.footer} dialog-footer card-footer ${className}`}
    />
  );
}

export function DialogTitle({
  id,
  className = "",
  ...props
}: ComponentProps<"h2">) {
  const generated = useId();
  const titleId = id ?? generated;
  const register = useContext(Labels)?.setTitle;
  useLayoutEffect(() => {
    register?.(titleId);
    return () =>
      register?.((current) => (current === titleId ? undefined : current));
  }, [register, titleId]);
  return (
    <h2
      {...props}
      id={titleId}
      data-dialog-title="true"
      className={`${styles.title} ${className}`}
    />
  );
}

export function DialogDescription({
  id,
  className = "",
  ...props
}: ComponentProps<"p">) {
  const generated = useId();
  const descriptionId = id ?? generated;
  const register = useContext(Labels)?.setDescription;
  useLayoutEffect(() => {
    register?.(descriptionId);
    return () =>
      register?.((current) =>
        current === descriptionId ? undefined : current,
      );
  }, [register, descriptionId]);
  return (
    <p
      {...props}
      id={descriptionId}
      data-dialog-description="true"
      className={`${styles.description} ${className}`}
    />
  );
}
