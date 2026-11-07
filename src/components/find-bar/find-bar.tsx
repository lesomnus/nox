import type { ComponentPropsWithRef, ReactNode } from "react";
import { useUI } from "../../providers/ui-provider";
import { Button } from "../button/button";
import { ToggleButton } from "../toggle-button/toggle-button";
import { Popover } from "../popover/popover";
import { CompactNumber } from "../compact-number/compact-number";
import { ScrollArea, type ScrollAreaProps } from "../scroll-area/scroll-area";
import styles from "./find-bar.module.css";
import { dialogEntranceClassName } from "../dialog-surface/dialog-surface";
export type FindBarProps = ComponentPropsWithRef<"section"> & {
  motion?: boolean;
};
export function FindBar({
  motion = false,
  className = "",
  ...props
}: FindBarProps) {
  return (
    <section
      role="search"
      {...props}
      className={`${styles.surface} ${motion ? dialogEntranceClassName : ""} ${className}`}
      data-enter-effect={motion ? "fade" : undefined}
    />
  );
}
export function FindBarControls({
  className = "",
  ...props
}: ComponentPropsWithRef<"div">) {
  return <div {...props} className={`${styles.controls} ${className}`} />;
}
export function FindBarIcon() {
  return (
    <svg
      className={styles.icon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}
export function FindBarInput({
  className = "",
  ...props
}: ComponentPropsWithRef<"input">) {
  const { t } = useUI();
  return (
    <input
      type="search"
      autoComplete="off"
      aria-label={t("Search")}
      {...props}
      className={`${styles.input} ${className}`}
    />
  );
}
export type FindOption = {
  id: string;
  label: string;
  symbol: ReactNode;
  pressed: boolean;
};
export function FindBarOptions({
  options,
  onChange,
}: {
  options: readonly FindOption[];
  onChange: (id: string, pressed: boolean) => void;
}) {
  const { t } = useUI();
  return (
    <div className={styles.modes} role="group" aria-label={t("Search options")}>
      {options.map((option) => (
        <Popover key={option.id} content={option.label}>
          <ToggleButton
            className={styles.mode}
            variant="toolbar"
            aria-label={option.label}
            pressed={option.pressed}
            onPressedChange={(pressed) => onChange(option.id, pressed)}
          >
            <span aria-hidden="true" data-find-option={option.id}>
              {option.symbol}
            </span>
          </ToggleButton>
        </Popover>
      ))}
    </div>
  );
}
export function FindBarCounter({
  current,
  count,
}: {
  current: number;
  count: number;
}) {
  const { t } = useUI();
  return (
    <span
      className={styles.counter}
      role="status"
      aria-label={t("Result {current} of {count}", { current, count })}
    >
      <span aria-hidden="true">
        <CompactNumber value={current} mode="integer" />
        <span className={styles.separator}>/</span>
        <CompactNumber value={count} mode="integer" />
      </span>
    </span>
  );
}
export function FindBarAction({
  className = "",
  ...props
}: ComponentPropsWithRef<typeof Button>) {
  return (
    <Button
      variant="toolbar"
      {...props}
      className={`${styles.action} ${className}`}
    />
  );
}
export function FindBarClose({
  onClick,
}: Pick<ComponentPropsWithRef<typeof Button>, "onClick">) {
  const { t } = useUI();
  return (
    <FindBarAction
      type="button"
      aria-label={t("Close search")}
      onClick={onClick}
    >
      ×
    </FindBarAction>
  );
}
export function FindBarMessage({
  className = "",
  ...props
}: ComponentPropsWithRef<"p">) {
  return <p {...props} className={`${styles.empty} ${className}`} />;
}
export function FindBarResults({
  className = "",
  contentClassName = "",
  ...props
}: ScrollAreaProps) {
  const { t } = useUI();
  return (
    <ScrollArea
      scrollbarOffset={-5}
      scrollbarLabel={t("Search results")}
      {...props}
      className={`${styles.results} ${className}`}
      contentClassName={`${styles.resultContent} ${contentClassName}`}
    />
  );
}
export function FindBarResult({
  className = "",
  ...props
}: ComponentPropsWithRef<typeof Button>) {
  return (
    <Button
      type="button"
      {...props}
      className={`${styles.result} ${className}`}
    />
  );
}
