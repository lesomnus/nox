import { useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "../button/button";
import styles from "./toggle-button.module.css";

export type ToggleButtonProps = Omit<
  ButtonProps,
  "aria-pressed" | "children" | "variant"
> & {
  /** Controlled selection state. */
  pressed?: boolean;
  /** Initial selection when pressed is not controlled. */
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  variant?: Exclude<ButtonProps["variant"], "outline">;
  /** Render a different icon for each state without changing the button label. */
  children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
};

export function ToggleButton({
  pressed,
  defaultPressed = false,
  onPressedChange,
  children,
  type = "button",
  variant = "default",
  className = "",
  onClick,
  ...props
}: ToggleButtonProps) {
  const [internalPressed, setInternalPressed] = useState(defaultPressed);
  const selected = pressed ?? internalPressed;
  return (
    <Button
      {...props}
      type={type}
      variant={variant}
      className={`${styles.toggle} ${className}`}
      aria-pressed={selected}
      onClick={(event) => {
        if (
          props.disabled ||
          props["aria-disabled"] === true ||
          props["aria-disabled"] === "true"
        ) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (pressed === undefined) setInternalPressed(!selected);
        onPressedChange?.(!selected);
      }}
    >
      {typeof children === "function"
        ? children({ pressed: selected })
        : children}
    </Button>
  );
}
