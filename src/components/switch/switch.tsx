import { InkSparkle } from "../ink-sparkle/ink-sparkle";
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
      onClick={() => {
        if (!pending) onChange(!checked);
      }}
    >
      <span aria-hidden="true" />
      {pending && (
        <InkSparkle
          className={styles.ink_sparkle}
          origin={[checked ? 48 : -8, 11]}
          centerMotion="fixed"
          duration={2000}
          loop
          color={checked ? [0, 0, 0, 0.5] : [1, 1, 1, 0.2]}
        />
      )}
    </button>
  );
}
