import type { ComponentPropsWithRef } from "react";
import { useUI } from "../../providers/ui-provider";
import { Button } from "../button/button";
import styles from "./action-error.module.css";

export type ActionErrorProps = Omit<ComponentPropsWithRef<"div">, "role"> & {
  onRetry?: () => void;
  pending?: boolean;
  retryLabel?: string;
};

/** Local, persistent failure feedback. Render it only when the action has failed. */
export function ActionError({
  children,
  onRetry,
  pending = false,
  retryLabel,
  className = "",
  ...props
}: ActionErrorProps) {
  const { t } = useUI();
  return (
    <div
      {...props}
      role="alert"
      aria-busy={pending || undefined}
      className={`${styles.error} ${className}`}
    >
      <span className={styles.message}>
        {children ?? t("Action failed. Please try again.")}
      </span>
      {onRetry && (
        <Button type="button" loading={pending} onClick={onRetry}>
          {retryLabel ?? t("Retry")}
        </Button>
      )}
    </div>
  );
}
