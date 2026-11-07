import {
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Button } from "../button/button";
import { useUI } from "../../providers/ui-provider";
import { CopyButton } from "../copy-button/copy-button";
import { Popover } from "../popover/popover";
import styles from "./identifier-value.module.css";

export type IdentifierValueProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
> & {
  value?: string | null;
  prefixLength?: number;
  copyable?: boolean;
  /** Copy the displayed value itself, or use a separate icon button. */
  copyTrigger?: "button" | "value";
  onCopy?: () => void | Promise<void>;
  copying?: boolean;
  copyLabel?: string;
  empty?: ReactNode;
};

export function IdentifierValue({
  value,
  prefixLength = 7,
  copyable = true,
  copyTrigger = "button",
  onCopy,
  copying = false,
  copyLabel,
  empty = "—",
  className = "",
  style,
  ...props
}: IdentifierValueProps) {
  const { t } = useUI();
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  if (!value) return <>{empty}</>;
  const length = Number.isFinite(prefixLength)
    ? Math.max(1, Math.floor(prefixLength))
    : 7;
  const prefix = <span className={styles.text}>{value.slice(0, length)}</span>;
  if (copyTrigger === "value" && copyable)
    return (
      <>
        <Button
          ref={setAnchor}
          type="button"
          effect="none"
          className={`${styles.copyValue} ${className}`}
          aria-label={copyLabel ?? t("Copy")}
          aria-busy={copying || undefined}
          onClick={onCopy ?? (() => navigator.clipboard.writeText(value))}
          onPointerEnter={(event) => {
            if (event.pointerType !== "touch") setOpen(true);
          }}
          onPointerLeave={() => {
            if (document.activeElement !== anchor) setOpen(false);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          style={style}
        >
          {prefix}
        </Button>
        <Popover
          anchor={anchor}
          open={open && value.length > length}
          onOpenChange={setOpen}
          placement="in-place"
          content={value}
        />
      </>
    );
  return (
    <span
      {...props}
      className={`${styles.value} ${className}`}
      style={{ "--identifier-length": length, ...style } as CSSProperties}
    >
      {value.length > length ? (
        <Popover content={value} placement="in-place">
          {prefix}
        </Popover>
      ) : (
        prefix
      )}
      {copyable && (
        <CopyButton className={styles.copy} value={value} label={copyLabel} />
      )}
    </span>
  );
}
