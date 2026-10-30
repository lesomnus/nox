import {
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
} from "react";
import { useUI } from "../../providers/ui-provider";
import { Button } from "../button/button";
import { MenuSurface } from "../menu-surface/menu-surface";
import { hintPosition, type PopoverPosition } from "../popover/hint-position";
import styles from "./action-error.module.css";

export type ActionErrorProps = Omit<ComponentPropsWithRef<"div">, "role"> & {
  onRetry?: () => void;
  showRetry?: boolean;
  pending?: boolean;
  retryLabel?: string;
  /** Anchor to the failed control without taking space in the page layout. */
  anchor?: HTMLElement | null;
  placement?: PopoverPosition;
};

/** Persistent failure feedback, optionally overlaid beside its triggering control. */
export function ActionError({
  children,
  onRetry,
  showRetry = false,
  pending = false,
  retryLabel,
  anchor,
  placement = "top-start",
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
  const [position, setPosition] = useState<{ top: number; left: number }>();
  useImperativeHandle(ref, () => surface.current!, [anchor]);
  useLayoutEffect(() => {
    const element = surface.current;
    if (!anchor || !element) return;
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
  }, [anchor, placement]);
  useLayoutEffect(() => {
    if (!anchor) return;
    const tokens = () =>
      anchor.getAttribute("aria-describedby")?.split(/\s+/).filter(Boolean) ??
      [];
    if (tokens().includes(id)) return;
    anchor.setAttribute("aria-describedby", [...tokens(), id].join(" "));
    return () => {
      const remaining = tokens().filter((token) => token !== id);
      if (remaining.length)
        anchor.setAttribute("aria-describedby", remaining.join(" "));
      else anchor.removeAttribute("aria-describedby");
    };
  }, [anchor, id]);
  const content = (
    <>
      <span className={styles.message}>
        {children ?? t("Action failed. Please try again.")}
      </span>
      {showRetry && onRetry && (
        <Button type="button" loading={pending} onClick={onRetry}>
          {retryLabel ?? t("Retry")}
        </Button>
      )}
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
