import { useRef, useState, type MouseEvent } from "react";
import {
  ActionError,
  ActionMenu,
  BorderTrailButton,
  Button,
  ButtonAnchor,
  ConfirmButton,
  CopyButton,
  FileChip,
  LinkButton,
  useAsyncAction,
} from "@lesomnus/nox";
import { Example, useFailOnce } from "./shared";

export type ActionKind =
  | "button"
  | "border-trail"
  | "confirm"
  | "file-chip"
  | "menu"
  | "link"
  | "anchor"
  | "copy";
const titles: Record<ActionKind, string> = {
  button: "Button",
  "border-trail": "BorderTrailButton",
  confirm: "ConfirmButton",
  "file-chip": "FileChip",
  menu: "ActionMenu",
  link: "LinkButton",
  anchor: "ButtonAnchor",
  copy: "CopyButton",
};

export function ActionFailureExample({
  kind = "button",
  showRetry = false,
}: {
  kind?: ActionKind;
  showRetry?: boolean;
}) {
  const failOnce = useFailOnce();
  const trigger = useRef<HTMLElement | null>(null);
  const [completed, setCompleted] = useState(false);
  const [clipboardFailed, setClipboardFailed] = useState(false);
  const action = useAsyncAction(async () => {
    await failOnce();
    setCompleted(true);
  });
  const run = async () => {
    if (await action.run())
      requestAnimationFrame(() =>
        trigger.current?.focus({ preventScroll: true }),
      );
  };
  const ref = (node: HTMLElement | null) => {
    trigger.current = node;
  };
  const buttonProps = {
    ref,
    type: "button" as const,
    loading: action.pending,
    onClick: () => void run(),
  };
  const linkProps = {
    ref,
    href: "#report-preview",
    "aria-disabled": action.pending,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        event.button ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      if (!action.pending) void run();
    },
  };
  return (
    <Example title={titles[kind]}>
      <div>
        {kind === "button" && <Button {...buttonProps}>Publish report</Button>}
        {kind === "border-trail" && (
          <BorderTrailButton {...buttonProps}>Publish report</BorderTrailButton>
        )}
        {kind === "confirm" && (
          <ConfirmButton
            ref={ref}
            type="button"
            loading={action.pending}
            confirmationLabel="Confirm publish"
            onConfirm={() => void run()}
          >
            Publish report
          </ConfirmButton>
        )}
        {kind === "file-chip" && (
          <FileChip
            as="button"
            ref={ref}
            type="button"
            loading={action.pending}
            disabled={action.pending}
            onClick={() => void run()}
          >
            report.csv
          </FileChip>
        )}
        {kind === "menu" && (
          <ActionMenu
            label="Report actions"
            disabled={action.pending}
            items={[
              {
                label: "Publish report",
                run: () => {
                  // ActionMenu has already restored focus to its opener.
                  trigger.current = document.activeElement as HTMLElement;
                  void run();
                },
              },
            ]}
          />
        )}
        {kind === "link" && (
          <LinkButton {...linkProps}>Load report preview</LinkButton>
        )}
        {kind === "anchor" && (
          <ButtonAnchor {...linkProps}>Load report preview</ButtonAnchor>
        )}
        {kind === "copy" && (
          <CopyButton
            ref={ref}
            value="report-42"
            onCopied={() => {
              setClipboardFailed(false);
              void run();
            }}
            onCopyError={() => setClipboardFailed(true)}
          />
        )}
      </div>
      {clipboardFailed && (
        <ActionError
          anchor={trigger.current}
          onDismiss={() => setClipboardFailed(false)}
        >
          Clipboard permission was denied. Allow access, then copy again.
        </ActionError>
      )}
      {action.error && (
        <ActionError
          onDismiss={action.reset}
          anchor={trigger.current}
          showRetry={showRetry}
          pending={action.pending}
          onRetry={() => void run()}
        >
          {kind === "copy"
            ? showRetry
              ? "Copied, but recording the copy failed. Retry only records it; the clipboard is already updated."
              : "Copied, but recording the copy failed. The clipboard is already updated."
            : kind === "link" || kind === "anchor"
              ? "Could not load the report preview. Please try again."
              : "Could not publish the report. Your report is still available."}
        </ActionError>
      )}
      {completed && (
        <p role="status">
          {kind === "copy" ? "Copy recorded" : "Action completed"}
        </p>
      )}
    </Example>
  );
}
