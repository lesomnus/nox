import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { FieldLabel } from "../field-label/field-label";
import styles from "./description-list.module.css";

export type DescriptionListRow = {
  id?: string;
  label: string;
  value?: ReactNode;
  description?: string;
};
export type DescriptionListProps = Omit<
  HTMLAttributes<HTMLDListElement>,
  "children"
> & {
  rows: readonly DescriptionListRow[];
  columns?: 1 | 2;
  empty?: ReactNode;
};

export function DescriptionList({
  rows,
  columns = 2,
  empty = "—",
  className = "",
  style,
  ...props
}: DescriptionListProps) {
  return (
    <dl
      {...props}
      className={`${styles.fields} ${className}`}
      style={
        { "--description-list-columns": columns, ...style } as CSSProperties
      }
    >
      {rows.map(({ id, label, value, description }) => (
        <div key={id ?? label}>
          <dt>
            <FieldLabel label={label} description={description} />
          </dt>
          <dd>
            {value === undefined || value === null || value === ""
              ? empty
              : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
