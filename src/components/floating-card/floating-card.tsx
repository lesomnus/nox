import styles from "./floating-card.module.css";
import type { HTMLAttributes, ReactNode, Ref } from "react";
import { Button } from "../button/button";
import { DialogReveal } from "../dialog-surface/dialog-surface";
import type { MenuMotionDirection } from "../action-menu/action-menu";

export function FloatingCard({
  title,
  hideHeading = false,
  headerCenter,
  revealFrom,
  close,
  closeLabel,
  bodyTabIndex,
  footer,
  children,
  className = "",
  ref,
  ...props
}: Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title: string;
  hideHeading?: boolean;
  /** Optional centered heading content, independent of title and close widths. */
  headerCenter?: ReactNode;
  /** Reveal content over a separate glass layer that stays blurred throughout. */
  revealFrom?: MenuMotionDirection;
  close?: () => void;
  closeLabel?: string;
  bodyTabIndex?: number;
  footer?: ReactNode;
  ref?: Ref<HTMLElement>;
}) {
  const content = (
    <>
      {!hideHeading && (
        <header
          className="card-heading"
          data-header-center={!!headerCenter || undefined}
        >
          <strong>{title}</strong>
          {headerCenter && (
            <div className="card-heading-center">{headerCenter}</div>
          )}
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
      <div className="card-body" tabIndex={bodyTabIndex}>
        {children}
      </div>
      {footer && <footer className="card-footer">{footer}</footer>}
    </>
  );
  return (
    <section
      ref={ref}
      className={`${styles.floating_card} floating-card ${className}`}
      {...props}
      data-reveal-from={revealFrom}
    >
      {revealFrom ? (
        <DialogReveal
          from={revealFrom}
          className={styles.reveal}
          contentClassName={styles.reveal}
        >
          {content}
        </DialogReveal>
      ) : (
        content
      )}
    </section>
  );
}
