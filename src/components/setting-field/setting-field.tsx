import styles from "./setting-field.module.css";
import { useId, type CSSProperties, type ReactNode } from "react";

// Supplementary guidance stays below the setting's metadata and control.
export function SettingField({
  title,
  settingId,
  summary,
  children,
  details,
  controlInset,
  controlPlacement = "below",
}: {
  title: string;
  settingId: string;
  summary?: string;
  children: ReactNode;
  details?: ReactNode;
  /** Expand the control past metadata edges by its text padding. Numbers use pixels. */
  controlInset?: CSSProperties["marginInline"];
  /** Inline controls sit beside the title/key group, centered vertically. */
  controlPlacement?: "below" | "inline";
}) {
  const heading = useId();
  const identifier = `${heading}-setting-id`;
  const control = <div className="setting-control">{children}</div>;
  return (
    <div
      className={`${styles.setting_row} setting-row`}
      role="group"
      aria-labelledby={`${heading} ${identifier}`}
      style={
        controlInset === undefined
          ? undefined
          : ({
              "--setting-control-inset":
                typeof controlInset === "number"
                  ? `${controlInset}px`
                  : controlInset,
            } as CSSProperties)
      }
    >
      <div className={styles.header}>
        <div className={styles.heading}>
          <strong className="setting-title" id={heading}>
            {title}
          </strong>
          <code className="setting-id" id={identifier}>
            {settingId}
          </code>
        </div>
        {controlPlacement === "inline" && control}
      </div>
      {summary && <p className="setting-summary">{summary}</p>}
      {controlPlacement === "below" && control}
      {details && <div className="setting-details">{details}</div>}
    </div>
  );
}
