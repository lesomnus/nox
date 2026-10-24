import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  ComponentPropsWithRef,
} from "react";
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

export type DescriptionListRootProps = ComponentPropsWithRef<"dl"> & {
  columns?: 1 | 2;
};
export type DescriptionListRowProps = ComponentPropsWithRef<"div">;
export type DescriptionListTermProps = ComponentPropsWithRef<"dt">;
export type DescriptionListDetailsProps = ComponentPropsWithRef<"dd">;

export function DescriptionListRoot({
  columns = 2,
  className = "",
  style,
  ...props
}: DescriptionListRootProps) {
  return (
    <dl
      {...props}
      className={`${styles.fields} ${className}`}
      style={
        { "--description-list-columns": columns, ...style } as CSSProperties
      }
    />
  );
}
export function DescriptionListRow({
  className = "",
  ...props
}: DescriptionListRowProps) {
  return <div {...props} className={`${styles.row} ${className}`} />;
}
export function DescriptionListTerm({
  className = "",
  ...props
}: DescriptionListTermProps) {
  return <dt {...props} className={`${styles.term} ${className}`} />;
}
export function DescriptionListDetails({
  className = "",
  ...props
}: DescriptionListDetailsProps) {
  return <dd {...props} className={`${styles.details} ${className}`} />;
}

export function DescriptionList({
  rows,
  columns = 2,
  empty = "—",
  ...props
}: DescriptionListProps) {
  return (
    <DescriptionListRoot {...props} columns={columns}>
      {rows.map(({ id, label, value, description }) => (
        <DescriptionListRow key={id ?? label}>
          <DescriptionListTerm>
            <FieldLabel label={label} description={description} />
          </DescriptionListTerm>
          <DescriptionListDetails>
            {value === undefined || value === null || value === ""
              ? empty
              : value}
          </DescriptionListDetails>
        </DescriptionListRow>
      ))}
    </DescriptionListRoot>
  );
}
