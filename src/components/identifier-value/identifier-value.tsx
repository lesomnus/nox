import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { CopyButton } from "../copy-button/copy-button";
import { OverflowHint } from "../overflow-hint/overflow-hint";
import styles from "./identifier-value.module.css";

export type IdentifierValueProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
> & {
  value?: string | null;
  prefixLength?: number;
  copyable?: boolean;
  copyLabel?: string;
  empty?: ReactNode;
};

export function IdentifierValue({
  value,
  prefixLength = 7,
  copyable = true,
  copyLabel,
  empty = "—",
  className = "",
  style,
  ...props
}: IdentifierValueProps) {
  if (!value) return <>{empty}</>;
  const length = Number.isFinite(prefixLength)
    ? Math.max(1, Math.floor(prefixLength))
    : 7;
  const prefix = <span className={styles.text}>{value.slice(0, length)}</span>;
  return (
    <span
      {...props}
      className={`${styles.value} ${className}`}
      style={{ "--identifier-length": length, ...style } as CSSProperties}
    >
      {value.length > length ? (
        <OverflowHint content={value} placement="in-place">
          {prefix}
        </OverflowHint>
      ) : (
        prefix
      )}
      {copyable && (
        <CopyButton className={styles.copy} value={value} label={copyLabel} />
      )}
    </span>
  );
}
