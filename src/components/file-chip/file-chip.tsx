import type { ComponentPropsWithRef, ReactNode } from "react";
import styles from "./file-chip.module.css";
import { FILE_CHIP_PREFIX, FILE_CHIP_SUFFIX } from "./file-chip-text";
export { fileChipText } from "./file-chip-text";

/** Apply to an existing sanitized anchor when React does not own its markup. */
export const fileChipClassName = styles.chip;

type SharedProps = {
  children: ReactNode;
  loading?: boolean;
  /** Match fileChipText(label) without changing native text's inline advances. */
  textLayout?: boolean;
};
export type FileChipProps = SharedProps &
  (
    | ({ as?: "span" } & ComponentPropsWithRef<"span">)
    | ({ as: "a" } & ComponentPropsWithRef<"a">)
    | ({ as: "button" } & ComponentPropsWithRef<"button">)
  );

export function FileChip({
  as = "span",
  children,
  loading = false,
  textLayout = false,
  className = "",
  ...props
}: FileChipProps) {
  const content = (
    <>
      <span
        className={styles.activity}
        aria-hidden="true"
        data-file-chip-activity
      />
      {textLayout && (
        <span aria-hidden="true" data-file-chip-prefix>
          {FILE_CHIP_PREFIX}
        </span>
      )}
      <span className={styles.label} data-file-chip-label>
        {children}
      </span>
      {textLayout && (
        <span aria-hidden="true" data-file-chip-suffix>
          {FILE_CHIP_SUFFIX}
        </span>
      )}
    </>
  );
  const common = {
    "data-file-chip": "",
    "data-text-layout": textLayout || undefined,
    "data-loading": loading || undefined,
    "aria-busy": loading,
    className: `${styles.chip} ${className}`.trim(),
  };
  if (as === "a")
    return (
      <a {...(props as ComponentPropsWithRef<"a">)} {...common}>
        {content}
      </a>
    );
  if (as === "button")
    return (
      <button
        type="button"
        {...(props as ComponentPropsWithRef<"button">)}
        {...common}
      >
        {content}
      </button>
    );
  return (
    <span {...(props as ComponentPropsWithRef<"span">)} {...common}>
      {content}
    </span>
  );
}
