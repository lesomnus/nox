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
      <span className={styles.box} aria-hidden="true">
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
    </span>
  );
}
