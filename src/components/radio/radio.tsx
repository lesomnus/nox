import type { InputHTMLAttributes, Ref } from "react";
import styles from "./radio.module.css";

export type RadioProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "children"
> & {
  ref?: Ref<HTMLInputElement>;
};

// Native grouping, focus, validation and form submission remain on the input.
// As with Checkbox, className decorates the outer control; label it externally.
export function Radio({ className = "", ref, ...props }: RadioProps) {
  return (
    <span className={`${styles.control} ${className}`}>
      <input {...props} ref={ref} className={styles.input} type="radio" />
      <span className={styles.circle} aria-hidden="true" />
    </span>
  );
}
