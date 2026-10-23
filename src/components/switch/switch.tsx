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
    </button>
  );
}
