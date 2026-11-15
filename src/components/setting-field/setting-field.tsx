import styles from "./setting-field.module.css";
import { useId, type CSSProperties, type ReactNode } from "react";

// Setting metadata stays above its control; supplementary guidance is optional.
export function SettingField({
  title,
  settingId,
  summary,
  children,
  details,
  controlInset,
}: {
  title: string;
  settingId: string;
  summary?: string;
  children: ReactNode;
  details?: ReactNode;
  /** Expand the control past metadata edges by its text padding. Numbers use pixels. */
  controlInset?: CSSProperties["marginInline"];
}) {
  const heading = useId();
  const identifier = `${heading}-setting-id`;
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
      <strong className="setting-title" id={heading}>
        {title}
      </strong>
      <code className="setting-id" id={identifier}>
        {settingId}
      </code>
      {summary && <p className="setting-summary">{summary}</p>}
      <div className="setting-control">{children}</div>
      {details && <div className="setting-details">{details}</div>}
    </div>
  );
}
