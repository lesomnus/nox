import { useCallback, type InputHTMLAttributes, type Ref } from "react";
import styles from "./checkbox.module.css";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "children"
> & {
  indeterminate?: boolean;
  ref?: Ref<HTMLInputElement>;
};

export function Checkbox({
  className = "",
  indeterminate = false,
  ref,
  ...props
}: CheckboxProps) {
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      if (node) node.indeterminate = indeterminate;
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    },
    [indeterminate, ref],
  );
  return (
    <span className={`${styles.control} ${className}`}>
      <input {...props} ref={attach} className={styles.input} type="checkbox" />
      <CheckboxIndicator />
    </span>
  );
}

export type CheckboxIndicatorProps = {
  checked?: boolean;
  indeterminate?: boolean;
  className?: string;
};

/** Decorative state for menuitemcheckbox; native forms should use Checkbox. */
export function CheckboxIndicator({
  checked = false,
  indeterminate = false,
  className = "",
}: CheckboxIndicatorProps) {
  return (
    <span
      className={`${styles.box} ${styles.indicator} ${className}`}
      data-checked={checked || undefined}
      data-indeterminate={indeterminate || undefined}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 18 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path className={styles.check} d="m4.5 9 3 3 6-6" />
        <path className={styles.mixed} d="M5 9h8" />
      </svg>
    </span>
  );
}
