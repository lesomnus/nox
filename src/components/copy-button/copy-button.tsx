import { useEffect, useId, useState, type ComponentProps } from "react";
import { useUI } from "../../providers/ui-provider";
import { Button } from "../button/button";
import styles from "./copy-button.module.css";

export type CopyButtonProps = Omit<
  ComponentProps<typeof Button>,
  "children" | "onClick" | "pressTarget"
> & {
  value: string;
  label?: string;
  onCopied?: () => void;
  onCopyError?: (error: unknown) => void;
};

export function CopyButton({
  value,
  label,
  onCopied,
  onCopyError,
  disabled,
  variant = "toolbar",
  className = "",
  ...props
}: CopyButtonProps) {
  const { t } = useUI();
  const id = useId();
  const [copying, setCopying] = useState(false);
  const [result, setResult] = useState<"copied" | "failed">();
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => setResult(undefined), 2000);
    return () => clearTimeout(timer);
  }, [result]);
  const feedback =
    result === "copied"
      ? t("Copied")
      : result === "failed"
        ? t("Copy failed")
        : undefined;
  return (
    <span className={styles.control}>
      <Button
        {...props}
        type="button"
        variant={variant}
        className={className}
        disabled={disabled || copying}
        aria-label={props["aria-label"] ?? label ?? t("Copy")}
        aria-describedby={[props["aria-describedby"], id]
          .filter(Boolean)
          .join(" ")}
        aria-busy={copying || undefined}
        onClick={async () => {
          setCopying(true);
          setResult(undefined);
          try {
            await navigator.clipboard.writeText(value);
          } catch (error) {
            setResult("failed");
            onCopyError?.(error);
            return;
          } finally {
            setCopying(false);
          }
          setResult("copied");
          onCopied?.();
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
        </svg>
      </Button>
      <span id={id} className={styles.hint} role="tooltip">
        {feedback ?? label ?? t("Copy")}
      </span>
      <span className={styles.status} role="status">
        {feedback}
      </span>
    </span>
  );
}
