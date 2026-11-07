import {
  useId,
  useRef,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { Button, type ButtonProps } from "../button/button";
import styles from "./tabs.module.css";
export type TabItem = {
  id: string;
  label: ReactNode;
  ariaLabel?: string;
  icon?: ReactNode;
  disabled?: boolean;
  panelId?: string;
};
export type TabsProps = Omit<
  ComponentPropsWithRef<"div">,
  "onChange" | "children"
> & {
  items: readonly TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  prefix?: string;
  panelId?: string;
  effect?: ButtonProps["effect"];
  orientation?: "horizontal" | "vertical";
};
export function Tabs({
  items,
  value,
  onValueChange,
  prefix,
  panelId,
  effect,
  orientation = "horizontal",
  className = "",
  ...props
}: TabsProps) {
  const generated = useId();
  const id = prefix ?? generated;
  const tabs = useRef(new Map<string, HTMLButtonElement>());
  const first = items.find((item) => !item.disabled)?.id;
  return (
    <div
      {...props}
      role="tablist"
      aria-orientation={orientation}
      className={`${styles.tabs} ${className}`}
    >
      {items.map((item, index) => (
        <Button
          ref={(node) => {
            if (node) tabs.current.set(item.id, node);
            else tabs.current.delete(item.id);
          }}
          key={item.id}
          id={`${id}-${index}`}
          type="button"
          role="tab"
          effect={effect}
          disabled={item.disabled}
          aria-label={item.ariaLabel}
          aria-selected={item.id === value}
          aria-controls={item.panelId ?? panelId}
          tabIndex={
            item.id ===
            (items.some((i) => i.id === value && !i.disabled) ? value : first)
              ? 0
              : -1
          }
          onClick={() => onValueChange(item.id)}
          onKeyDown={(event) => {
            const forward =
              orientation === "vertical" ? "ArrowDown" : "ArrowRight";
            const backward =
              orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
            if (
              ![forward, backward, "Home", "End"].includes(event.key) ||
              event.altKey ||
              event.ctrlKey ||
              event.metaKey
            )
              return;
            event.preventDefault();
            const enabled = items.filter((i) => !i.disabled);
            const current = enabled.findIndex((i) => i.id === item.id);
            const rtl =
              orientation === "horizontal" &&
              getComputedStyle(event.currentTarget).direction === "rtl";
            const delta = (event.key === forward ? 1 : -1) * (rtl ? -1 : 1);
            const next =
              event.key === "Home"
                ? enabled[0]
                : event.key === "End"
                  ? enabled.at(-1)
                  : enabled[
                      (current + delta + enabled.length) % enabled.length
                    ];
            if (next) {
              onValueChange(next.id);
              tabs.current.get(next.id)?.focus();
            }
          }}
        >
          {item.icon != null && (
            <span className={styles.icon} data-tab-icon aria-hidden="true">
              {item.icon}
            </span>
          )}
          <span className={styles.label} data-tab-label>
            {item.label}
          </span>
        </Button>
      ))}
    </div>
  );
}
