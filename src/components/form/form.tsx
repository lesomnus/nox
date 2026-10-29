import {
  createElement,
  type ComponentPropsWithRef,
  type CSSProperties,
} from "react";
import layout from "../field-layout/field-layout.module.css";
import styles from "./form.module.css";

export type FormProps = {
  columns?: 1 | 2;
} & (
  | ({ as?: "form" } & ComponentPropsWithRef<"form">)
  | ({ as: "fieldset" } & ComponentPropsWithRef<"fieldset">)
);

/** Compact native form layout; validation and submission stay with the caller. */
export function Form({
  as = "form",
  columns = 2,
  className = "",
  style,
  ...props
}: FormProps) {
  return createElement(as, {
    ...props,
    className: `${layout.fields} ${styles.form} ${className}`,
    style: { "--field-columns": columns, ...style } as CSSProperties,
  });
}

export type FormFieldProps = ComponentPropsWithRef<"div"> & {
  label: string;
  /** Associate the label with a native input's id. Custom controls own their label. */
  htmlFor?: string;
  fullWidth?: boolean;
};

export function FormField({
  label,
  htmlFor,
  fullWidth = false,
  className = "",
  children,
  ...props
}: FormFieldProps) {
  return (
    <div
      {...props}
      className={`${layout.row} ${styles.field} ${className}`}
      data-full-width={fullWidth || undefined}
    >
      {htmlFor ? (
        <label className={layout.term} htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <span className={layout.term}>{label}</span>
      )}
      <div className={`${layout.details} ${styles.control}`}>{children}</div>
    </div>
  );
}
