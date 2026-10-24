import type { ComponentPropsWithRef } from "react";
import { ScrollArea, type ScrollAreaProps } from "../scroll-area/scroll-area";
import styles from "./table.module.css";

export type TableProps = ComponentPropsWithRef<"table"> & {
  /** Keeps the entire header visible within the nearest scrolling ancestor. */
  stickyHeader?: boolean;
};

export function Table({
  stickyHeader = true,
  className = "",
  ...props
}: TableProps) {
  return (
    <table
      {...props}
      className={`${styles.table} ${className}`}
      data-sticky-header={stickyHeader || undefined}
    />
  );
}

export type TableHeaderProps = ComponentPropsWithRef<"thead">;
export function TableHeader({ className = "", ...props }: TableHeaderProps) {
  return <thead {...props} className={`${styles.header} ${className}`} />;
}

export type TableBodyProps = ComponentPropsWithRef<"tbody">;
export function TableBody({ className = "", ...props }: TableBodyProps) {
  return <tbody {...props} className={`${styles.body} ${className}`} />;
}

export type TableFooterProps = ComponentPropsWithRef<"tfoot">;
export function TableFooter({ className = "", ...props }: TableFooterProps) {
  return <tfoot {...props} className={`${styles.footer} ${className}`} />;
}

export type TableRowProps = ComponentPropsWithRef<"tr"> & {
  /** Visual selection only. The caller owns selection and its controls. */
  selected?: boolean;
};
export function TableRow({
  selected,
  className = "",
  ...props
}: TableRowProps) {
  return (
    <tr
      aria-selected={selected}
      {...props}
      className={`${styles.row} ${className}`}
      data-selected={selected || undefined}
    />
  );
}

export type TableHeadProps = ComponentPropsWithRef<"th">;
export function TableHead({
  scope = "col",
  className = "",
  ...props
}: TableHeadProps) {
  return (
    <th {...props} scope={scope} className={`${styles.head} ${className}`} />
  );
}

export type TableCellProps = ComponentPropsWithRef<"td">;
export function TableCell({ className = "", ...props }: TableCellProps) {
  return <td {...props} className={`${styles.cell} ${className}`} />;
}

export type TableCaptionProps = ComponentPropsWithRef<"caption">;
export function TableCaption({ className = "", ...props }: TableCaptionProps) {
  return <caption {...props} className={`${styles.caption} ${className}`} />;
}

export type TableScrollAreaProps = ScrollAreaProps;
/** Optional bounded scrolling, using the same scrollbar as ScrollArea. */
export function TableScrollArea({
  className = "",
  classNames = {},
  ...props
}: TableScrollAreaProps) {
  return (
    <ScrollArea
      {...props}
      className={`${styles.scroll} ${className}`}
      classNames={{
        ...classNames,
        topFade: `${styles.topFade} ${classNames.topFade ?? ""}`,
      }}
    />
  );
}
