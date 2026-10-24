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
  /** Allow Escape and backdrop dismissal. Business policy belongs to the caller. */
  dismissible?: boolean;
  initialFocus?: RefObject<HTMLElement | null>;
};

/** A controlled native modal boundary. Content, actions and async work belong to the host. */
export function Dialog({
  open,
  onClose,
  dismissible = true,
  initialFocus,
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
  const outside = useRef(false);
  const [title, setTitle] = useState<string>();
  const [description, setDescription] = useState<string>();
  const focus = useRef(initialFocus);
  useLayoutEffect(() => {
    focus.current = initialFocus;
  }, [initialFocus]);
  useLayoutEffect(() => {
    if (!open || !dialog.current) return;
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
    const target = focus.current?.current;
    if (target && node.contains(target)) target.focus({ preventScroll: true });
    return () => {
      node.close();
      if (origin?.isConnected) origin.focus({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <dialog
      {...props}
      ref={(node) => {
        dialog.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
      tabIndex={-1}
      className={`${dialogClassName} ${styles.dialog} dialog ${className}`}
      aria-labelledby={
        props["aria-labelledby"] ?? (props["aria-label"] ? undefined : title)
      }
      aria-describedby={props["aria-describedby"] ?? description}
      onClose={(event) => {
        // Also synchronize native dialog.close()/form method=dialog with the host.
        // Ignore close events from StrictMode cleanup followed by reopening.
        if (event.currentTarget.isConnected && !event.currentTarget.open)
          onClose();
      }}
      onCancel={(event) => {
        onCancel?.(event);
        const canceled = event.defaultPrevented;
        event.preventDefault();
        if (!canceled && dismissible) onClose();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        outside.current =
          !event.defaultPrevented &&
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
        <DialogSurface>
          <div className={`${styles.content} floating-card`}>{children}</div>
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
