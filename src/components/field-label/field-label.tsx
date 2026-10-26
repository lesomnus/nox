import { useUI } from "../../providers/ui-provider";
import { Popover, type PopoverPosition } from "../popover/popover";
import styles from "./field-label.module.css";

export type FieldLabelProps = {
  label: string;
  description?: string;
  /** Help tooltip side/alignment. Defaults to its bottom-left above the icon. */
  helpPlacement?: PopoverPosition;
};

export function FieldLabel({
  label,
  description,
  helpPlacement = "top-start",
}: FieldLabelProps) {
  const { t } = useUI();
  return (
    <span className={styles.label}>
      <span>{label}</span>
      {description && (
        <span className={styles.help}>
          <Popover content={description} placement={helpPlacement}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              role="img"
              aria-label={t("About {label}", { label })}
            >
              <circle cx="12" cy="12" r="8" />
              <path d="M12 11v6" />
              <circle
                cx="12"
                cy="7.5"
                r=".75"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </Popover>
        </span>
      )}
    </span>
  );
}
