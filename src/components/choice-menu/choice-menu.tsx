import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "../button/button";
import { AnchoredMenu } from "../menu-surface/anchored-menu";
import {
  MenuDivider,
  MenuItem,
  MenuItemLabel,
} from "../menu-surface/menu-item";
import { MenuScrollArea } from "../menu-surface/menu-scroll-area";
import { CheckboxIndicator } from "../checkbox/checkbox";
import { RadioIndicator } from "../radio/radio";
import styles from "./choice-menu.module.css";

export type ChoiceMenuOption = {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
};
export type CheckboxMenuOption = ChoiceMenuOption;
export type RadioMenuOption = ChoiceMenuOption;
type CommonProps = {
  label: string;
  options: readonly ChoiceMenuOption[];
  triggerContent?: ReactNode;
  disabled?: boolean;
  triggerClassName?: string;
  menuClassName?: string;
};
export type CheckboxMenuProps = CommonProps & {
  allLabel: string;
  value: readonly string[];
  choose: (value: string[]) => void;
};
export type RadioMenuProps = CommonProps & {
  value: string;
  choose: (value: string) => void;
};

/** Multiple selection. Draft changes commit once when the menu is dismissed. */
export function CheckboxMenu(props: CheckboxMenuProps) {
  return <ChoiceMenu {...props} kind="checkbox" />;
}
/** Single selection, with the same draft/close lifecycle and row layout. */
export function RadioMenu({ value, choose, ...props }: RadioMenuProps) {
  return (
    <ChoiceMenu
      {...props}
      kind="radio"
      value={[value]}
      choose={(values) => choose(values[0] ?? "")}
    />
  );
}

function ChoiceMenu({
  label,
  allLabel,
  options,
  value,
  choose,
  triggerContent,
  disabled = false,
  triggerClassName = "",
  menuClassName = "",
  kind,
}: CommonProps & {
  kind: "checkbox" | "radio";
  allLabel?: string;
  value: readonly string[];
  choose: (value: string[]) => void;
}) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const [draft, setDraft] = useState<readonly string[] | null>(null);
  const pending = useRef<readonly string[] | null>(null);
  const latest = useRef({ value, choose });
  latest.current = { value, choose };
  const open = draft !== null;
  const chosen = draft ?? value;
  const edit = (next: readonly string[]) => {
    pending.current = next;
    setDraft(next);
  };
  const close = useCallback((restoreFocus = false) => {
    const next = pending.current;
    if (next === null) return;
    pending.current = null;
    setDraft(null);
    const { value, choose } = latest.current;
    try {
      if (
        next.length !== value.length ||
        next.some((item) => !value.includes(item))
      )
        choose([...next]);
    } finally {
      if (restoreFocus) button.current?.focus({ preventScroll: true });
    }
  }, []);
  useEffect(() => {
    if (disabled) close();
  }, [disabled, close]);
  const enabled = options.filter((option) => !option.disabled);
  const all =
    enabled.length > 0 &&
    enabled.every((option) => chosen.includes(option.value));
  const some = enabled.some((option) => chosen.includes(option.value));
  return (
    <>
      <Button
        ref={button}
        type="button"
        variant="toolbar"
        disabled={disabled}
        className={`${styles.trigger} ${triggerClassName}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        data-menu-open={open || undefined}
        data-filtered={(kind === "checkbox" && !all) || undefined}
        onClick={() => (open ? close() : edit([...value]))}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            edit([...value]);
          }
        }}
      >
        {triggerContent ?? label}
      </Button>
      {open && button.current && (
        <AnchoredMenu
          id={id}
          anchor={button.current}
          label={label}
          className={`${styles.menu} ${kind === "radio" ? styles.radioMenu : ""} ${menuClassName}`}
          close={close}
        >
          <MenuScrollArea>
            {kind === "checkbox" && (
              <>
                <MenuItem
                  pressTarget="[data-choice-menu-content]"
                  role="menuitemcheckbox"
                  aria-checked={all ? true : some ? "mixed" : false}
                  disabled={!enabled.length}
                  onClick={() =>
                    edit(
                      all
                        ? chosen.filter(
                            (item) =>
                              !enabled.some((option) => option.value === item),
                          )
                        : [
                            ...new Set([
                              ...chosen,
                              ...enabled.map((option) => option.value),
                            ]),
                          ],
                    )
                  }
                >
                  <CheckboxIndicator
                    checked={all}
                    indeterminate={!all && some}
                  />
                  <span className={styles.itemContent} data-choice-menu-content>
                    <MenuItemLabel>{allLabel}</MenuItemLabel>
                  </span>
                </MenuItem>
                <MenuDivider />
              </>
            )}
            {options.map((option) => {
              const checked = chosen.includes(option.value);
              return (
                <MenuItem
                  key={option.value}
                  pressTarget="[data-choice-menu-content]"
                  role={
                    kind === "checkbox" ? "menuitemcheckbox" : "menuitemradio"
                  }
                  aria-label={option.label}
                  aria-checked={checked}
                  disabled={option.disabled}
                  onClick={() =>
                    edit(
                      kind === "radio"
                        ? [option.value]
                        : checked
                          ? chosen.filter((item) => item !== option.value)
                          : [...chosen, option.value],
                    )
                  }
                >
                  {kind === "checkbox" ? (
                    <CheckboxIndicator checked={checked} />
                  ) : (
                    <RadioIndicator checked={checked} />
                  )}
                  <span className={styles.itemContent} data-choice-menu-content>
                    {option.icon && (
                      <span className={styles.optionIcon}>{option.icon}</span>
                    )}
                    <MenuItemLabel>{option.label}</MenuItemLabel>
                  </span>
                </MenuItem>
              );
            })}
          </MenuScrollArea>
        </AnchoredMenu>
      )}
    </>
  );
}
