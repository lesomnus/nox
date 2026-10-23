import { useRef } from "react";
import { InkSparkle } from "./ink-sparkle";
import styles from "./switch.module.css";

export function Switch({
  label,
  checked,
  disabled = false,
  pending = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  /** Keep checked at the current value while its opposite is being applied. */
  pending?: boolean;
  onChange: (checked: boolean) => void;
}) {
  const position = useRef<readonly [number, number] | undefined>(undefined);
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      data-pending={pending || undefined}
      disabled={disabled}
      className={styles.switch_control}
      onClick={(event) => {
        if (pending) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        position.current =
          event.detail > 0
            ? [event.clientX - bounds.left, event.clientY - bounds.top]
            : [checked ? 29 : 11, 11];
        onChange(!checked);
      }}
    >
      <span aria-hidden="true" />
      {pending && (
        <InkSparkle
          className={styles.ink_sparkle}
          origin={position.current ?? [checked ? 29 : 11, 11]}
          color={checked ? [0, 0, 0, 0.5] : [1, 1, 1, 0.5]}
        />
      )}
    </button>
  );
}
