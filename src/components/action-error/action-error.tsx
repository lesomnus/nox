import {
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { useUI } from "../../providers/ui-provider";
import { Button } from "../button/button";
import { MenuSurface } from "../menu-surface/menu-surface";
import { hintPosition, type PopoverPosition } from "../popover/hint-position";
import { describeErrorAnchor } from "./error-anchor";
import styles from "./action-error.module.css";

export type ActionErrorProps = Omit<
  ComponentPropsWithRef<"div">,
  "role" | "title"
> & {
  title?: ReactNode;
  onDismiss?: () => void;
  onRetry?: () => void;
  showRetry?: boolean;
  pending?: boolean;
  retryLabel?: string;
  /** Anchor to the failed control without taking space in the page layout. */
  anchor?: HTMLElement | null;
  placement?: PopoverPosition;
  /** Disable the default stroke while retaining data-action-error-open for custom styles. */
  highlightTrigger?: boolean;
};

/** Persistent failure feedback, optionally overlaid beside its triggering control. */
export function ActionError({
  children,
  title,
  onDismiss,
  onRetry,
  showRetry = false,
  pending = false,
  retryLabel,
  anchor,
  placement = "top-start",
  highlightTrigger = true,
  id: suppliedId,
  ref,
  style,
  className = "",
  ...props
}: ActionErrorProps) {
  const { t } = useUI();
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const surface = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>();
  useImperativeHandle(ref, () => surface.current!, [anchor, dismissed]);
  useLayoutEffect(() => {
    const element = surface.current;
    if (!anchor || !element || dismissed) return;
    const place = () => {
      const gap = parseFloat(getComputedStyle(element).rowGap) || 0;
      const next = hintPosition(
        anchor.getBoundingClientRect(),
        element.getBoundingClientRect(),
        placement,
        { width: innerWidth, height: innerHeight },
        gap,
      );
      setPosition((previous) =>
        previous?.top === next.top && previous.left === next.left
          ? previous
          : next,
      );
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(anchor);
    observer.observe(element);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      window.visualViewport?.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("scroll", place);
    };
  }, [anchor, placement, dismissed]);
  useLayoutEffect(() => {
    if (!anchor || dismissed) return;
    return describeErrorAnchor(anchor, id, highlightTrigger);
  }, [anchor, id, highlightTrigger, dismissed]);
  if (dismissed) return null;
  const content = (
    <>
      <header className={styles.header}>
        <strong className={styles.title}>{title ?? t("Action failed")}</strong>
        <Button
          type="button"
          className={styles.close}
          aria-label={t("Dismiss error")}
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
            if (anchor?.isConnected) anchor.focus({ preventScroll: true });
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="var(--ui-icon-stroke-width, 1.6)"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </Button>
      </header>
      <div className={styles.body}>
        <span className={styles.message}>
          {children ?? t("Action failed. Please try again.")}
        </span>
        {showRetry && onRetry && (
          <Button type="button" loading={pending} onClick={onRetry}>
            {retryLabel ?? t("Retry")}
          </Button>
        )}
      </div>
    </>
  );
  const attributes = {
    ...props,
    id,
    role: "alert",
    "aria-busy": pending || undefined,
    className: `${styles.error} ${className}`,
  } as const;
  if (anchor !== undefined)
    return anchor ? (
      <MenuSurface
        {...attributes}
        anchor={anchor}
        ref={surface}
        data-action-error-overlay="true"
        style={{
          ...style,
          ...position,
          visibility: position ? "visible" : "hidden",
        }}
      >
        {content}
      </MenuSurface>
    ) : null;
  return (
    <div {...attributes} ref={surface} style={style}>
      {content}
    </div>
  );
}
