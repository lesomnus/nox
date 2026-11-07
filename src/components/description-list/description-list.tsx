import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  ComponentPropsWithRef,
} from "react";
import { FieldLabel } from "../field-label/field-label";
import styles from "../field-layout/field-layout.module.css";
import surface from "./description-list.module.css";

export type DescriptionListRow = {
  id?: string;
  label: string;
  value?: ReactNode;
  description?: string;
  labelDetail?: ReactNode;
  fullWidth?: boolean;
};
export type DescriptionListProps = Omit<
  HTMLAttributes<HTMLDListElement>,
  "children"
> & {
  rows: readonly DescriptionListRow[];
  columns?: 1 | 2 | 3 | readonly number[];
  variant?: "default" | "controls";
  density?: "default" | "compact";
  empty?: ReactNode;
};

export type DescriptionListRootProps = ComponentPropsWithRef<"dl"> & {
  columns?: 1 | 2 | 3 | readonly number[];
  variant?: "default" | "controls";
  density?: "default" | "compact";
};
export type DescriptionListRowProps = ComponentPropsWithRef<"div"> & {
  fullWidth?: boolean;
};
export type DescriptionListTermProps = ComponentPropsWithRef<"dt">;
export type DescriptionListDetailsProps = ComponentPropsWithRef<"dd">;

export function DescriptionListRoot({
  columns = 2,
  variant = "default",
  density = "default",
  className = "",
  style,
  ...props
}: DescriptionListRootProps) {
  return (
    <dl
      {...props}
      className={`${styles.fields} ${surface.fields} ${variant === "controls" ? surface.controls : ""} ${density === "compact" ? surface.compact : ""} ${className}`}
      style={
        {
          "--field-columns":
            typeof columns === "number" ? columns : columns.length,
          gridTemplateColumns:
            typeof columns === "number"
              ? undefined
              : columns.map((weight) => `minmax(0, ${weight}fr)`).join(" "),
          ...style,
        } as CSSProperties
      }
    />
  );
}
export function DescriptionListRow({
  fullWidth,
  className = "",
  ...props
}: DescriptionListRowProps) {
  return (
    <div
      {...props}
      className={`${styles.row} ${fullWidth ? surface.fullWidth : ""} ${className}`}
    />
  );
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
      {rows.map(({ id, label, value, description, labelDetail, fullWidth }) => (
        <DescriptionListRow key={id ?? label} fullWidth={fullWidth}>
          <DescriptionListTerm>
            <FieldLabel label={label} description={description} />
            {labelDetail != null && (
              <DescriptionListAnnotation>
                {labelDetail}
              </DescriptionListAnnotation>
            )}
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

export function DescriptionListAnnotation({
  error = false,
  className = "",
  ...props
}: ComponentPropsWithRef<"span"> & { error?: boolean }) {
  return (
    <span
      {...props}
      className={`${error ? surface.copyError : surface.labelDetail} ${className}`}
    />
  );
}
