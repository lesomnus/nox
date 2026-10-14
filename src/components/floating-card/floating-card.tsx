import styles from "./floating-card.module.css";
import type { HTMLAttributes, ReactNode, Ref } from "react";
import { Button } from "../button/button";

export function FloatingCard({
  title,
  hideHeading = false,
  close,
  closeLabel,
  bodyTabIndex,
  bodyWrapperClassName,
  footer,
  children,
  className = "",
  ref,
  ...props
}: Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title: string;
  hideHeading?: boolean;
  close?: () => void;
  closeLabel?: string;
  bodyTabIndex?: number;
  bodyWrapperClassName?: string;
  footer?: ReactNode;
  ref?: Ref<HTMLElement>;
}) {
  const body = (
    <div className="card-body" tabIndex={bodyTabIndex}>
      {children}
    </div>
  );
  return (
    <section
      ref={ref}
      className={`${styles.floating_card} floating-card ${className}`}
      {...props}
    >
      {!hideHeading && (
        <header className="card-heading">
          <strong>{title}</strong>
          {close && (
            <Button
              className="card-close"
              type="button"
              aria-label={closeLabel}
              onClick={close}
            >
              ×
            </Button>
          )}
        </header>
      )}
      {bodyWrapperClassName ? (
        <div className={bodyWrapperClassName}>{body}</div>
      ) : (
        body
      )}
      {footer && <footer className="card-footer">{footer}</footer>}
    </section>
  );
}
