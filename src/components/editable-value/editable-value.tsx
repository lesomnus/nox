import styles from "./editable-value.module.css";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "../button/button";
import { ActionError } from "../action-error/action-error";
import {
  dialogClassName,
  dialogAppearanceClassName,
} from "../dialog-surface/dialog-surface";
import { useUI } from "../../providers/ui-provider";
import {
  captureDialogTrigger,
  DialogTrigger,
  type DialogTriggerOrigin,
} from "../dialog-trigger/dialog-trigger";

// A native modal keeps shortcuts and the background inert while the input
// occupies exactly the displayed value's bounds, even inside a floating card.
export function EditableValue({
  label,
  value,
  save,
  validate,
  monospace = false,
}: {
  label: string;
  value: string;
  save: (value: string) => Promise<void>;
  validate?: (value: string) => string | undefined;
  monospace?: boolean;
}) {
  const { t } = useUI();
  const trigger = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const [labelOrigin, setLabelOrigin] = useState<DialogTriggerOrigin>();
  return (
    <>
      <Button
        ref={trigger}
        type="button"
        className={`${styles.editable_value_trigger} editable-value-trigger`}
        data-monospace={monospace}
        aria-label={t("Edit {label}", { label })}
        aria-haspopup="dialog"
        onClick={() => {
          // Native description-list terms label their following values.
          let term = trigger.current?.closest("dd")?.previousElementSibling;
          while (term?.matches("dd")) term = term.previousElementSibling;
          setLabelOrigin(
            term instanceof HTMLElement && term.matches("dt")
              ? captureDialogTrigger(term)
              : undefined,
          );
          setEditing(true);
        }}
      >
        {value || "—"}
      </Button>
      {editing && (
        <ValueEditor
          label={label}
          value={value}
          origin={trigger.current!}
          labelOrigin={labelOrigin}
          save={save}
          validate={validate}
          close={() => setEditing(false)}
        />
      )}
    </>
  );
}

function ValueEditor({
  label,
  value,
  origin,
  labelOrigin,
  save,
  validate,
  close,
}: {
  label: string;
  value: string;
  origin: HTMLButtonElement;
  labelOrigin?: DialogTriggerOrigin;
  save: (value: string) => Promise<void>;
  validate?: (value: string) => string | undefined;
  close: () => void;
}) {
  const { t } = useUI();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const saving = useRef(false);
  const alive = useRef(false);
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const errorId = useId();
  const [position, setPosition] = useState<CSSProperties>();
  useLayoutEffect(() => {
    const element = labelOrigin?.element;
    if (!element) return;
    // Preserve layout, but avoid painting the same label twice across layers.
    const visibility = element.style.getPropertyValue("visibility");
    const priority = element.style.getPropertyPriority("visibility");
    element.style.setProperty("visibility", "hidden");
    return () => {
      if (visibility)
        element.style.setProperty("visibility", visibility, priority);
      else element.style.removeProperty("visibility");
    };
  }, [labelOrigin]);
  useLayoutEffect(() => {
    const node = dialog.current!;
    alive.current = true;
    const measure = () => {
      const bounds = origin.getBoundingClientRect();
      const font = getComputedStyle(origin);
      setPosition({
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        font: font.font,
        letterSpacing: font.letterSpacing,
        "--editable-value-height": `${bounds.height}px`,
        "--editable-value-padding": font.padding,
        "--editable-value-radius": font.borderRadius,
      } as CSSProperties);
    };
    measure();
    node.showModal();
    input.current!.focus({ preventScroll: true });
    input.current!.select();
    const observer = new ResizeObserver(measure);
    observer.observe(origin);
    window.addEventListener("resize", measure);
    // Keep the overlay anchored if its parent scrolls or the mobile keyboard opens.
    document.addEventListener("scroll", measure, true);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);
    return () => {
      alive.current = false;
      observer.disconnect();
      window.removeEventListener("resize", measure);
      document.removeEventListener("scroll", measure, true);
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
      node.close();
      if (origin.isConnected) origin.focus({ preventScroll: true });
    };
  }, [origin]);
  async function submit() {
    if (saving.current) return;
    const next = draft.trim();
    const invalid = validate?.(next);
    if (invalid) {
      setError(invalid);
      input.current?.focus({ preventScroll: true });
      return;
    }
    if (next === value) {
      close();
      return;
    }
    saving.current = true;
    setBusy(true);
    try {
      await save(next);
      if (alive.current) close();
    } catch (failure) {
      if (alive.current) setError(String(failure));
    } finally {
      saving.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return createPortal(
    <dialog
      ref={dialog}
      className={`${dialogClassName} ${styles.editable_value_dialog} editable-value-dialog`}
      style={position}
      aria-label={t("Edit {label}", { label })}
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();
        if (!saving.current) close();
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || saving.current) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          close();
      }}
    >
      {position && labelOrigin && (
        <DialogTrigger origin={labelOrigin} adjacent />
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void submit();
        }}
      >
        <input
          ref={input}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          value={draft}
          readOnly={busy}
          onChange={(event) => {
            setDraft(event.target.value);
            setError("");
          }}
          autoComplete="off"
          spellCheck={false}
        />
        <div className={`${dialogAppearanceClassName} editable-value-overlay`}>
          {error && (
            <ActionError
              id={errorId}
              anchor={input.current}
              placement="top-start"
              pending={busy}
              onRetry={() => void submit()}
            >
              {error}
            </ActionError>
          )}
          <div className="editable-value-actions">
            <Button type="button" disabled={busy} onClick={close}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t("Working…") : t("Confirm")}
            </Button>
          </div>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}
