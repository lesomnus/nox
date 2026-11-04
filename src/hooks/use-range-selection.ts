import { useId, useLayoutEffect, useMemo, useRef } from "react";
import type { CheckboxProps } from "../components/checkbox/checkbox";

export type RangeSelectionOptions<Key extends string | number> = {
  /** Unique keys in their current visible order. */
  items: readonly Key[];
  selected: ReadonlySet<Key>;
  onSelectionChange: (selected: Set<Key>) => void;
  disabled?: boolean;
  isItemDisabled?: (key: Key) => boolean;
};
export type RangeSelectionCheckboxProps = Pick<
  CheckboxProps,
  | "checked"
  | "disabled"
  | "indeterminate"
  | "onPointerDown"
  | "onClick"
  | "onChange"
> & {
  "data-nox-range-selection"?: string;
  "data-nox-range-index"?: number;
};

/** Controlled checkbox painting and Shift ranges, independent of table markup. */
export function useRangeSelection<Key extends string | number>(
  options: RangeSelectionOptions<Key>,
) {
  const scope = useId();
  const latest = useRef(options);
  const anchor = useRef<Key | undefined>(undefined);
  const suppressClick = useRef(false);
  const gesture = useRef<
    | {
        items: readonly Key[];
        start?: Key;
        last: number;
        checked: boolean;
        cleanup: () => void;
      }
    | undefined
  >(undefined);
  const indexes = useMemo(
    () => new Map(options.items.map((key, index) => [key, index])),
    [options.items],
  );

  function stop() {
    const current = gesture.current;
    gesture.current = undefined;
    current?.cleanup();
  }
  useLayoutEffect(() => {
    latest.current = options;
    if (anchor.current !== undefined && !indexes.has(anchor.current))
      anchor.current = undefined;
    const current = gesture.current;
    if (
      current &&
      (options.disabled ||
        (current.start !== undefined &&
          options.isItemDisabled?.(current.start)) ||
        current.items.length !== options.items.length ||
        current.items.some((key, i) => key !== options.items[i]))
    )
      stop();
  });
  useLayoutEffect(() => () => stop(), []);

  function change(keys: readonly Key[], checked: boolean) {
    const current = latest.current;
    if (current.disabled) return;
    const next = new Set(current.selected);
    let changed = false;
    for (const key of keys) {
      if (current.isItemDisabled?.(key) || next.has(key) === checked) continue;
      if (checked) next.add(key);
      else next.delete(key);
      changed = true;
    }
    if (!changed) return;
    // Continuous pointer events may arrive before the controlled render commits.
    latest.current = { ...current, selected: next };
    current.onSelectionChange(next);
  }
  function range(from: number, to: number) {
    return latest.current.items.slice(
      Math.min(from, to),
      Math.max(from, to) + 1,
    );
  }
  function activate(key: Key, checked: boolean, shift: boolean) {
    const current = latest.current;
    if (current.disabled || current.isItemDisabled?.(key)) return;
    const from =
      anchor.current === undefined ? -1 : current.items.indexOf(anchor.current);
    const to = current.items.indexOf(key);
    if (to < 0) return;
    if (shift && from >= 0) change(range(from, to), checked);
    else {
      anchor.current = key;
      change([key], checked);
    }
  }
  const pointerClick = (event: Event) =>
    suppressClick.current && "detail" in event && Number(event.detail) > 0;
  const click: NonNullable<CheckboxProps["onClick"]> = (event) => {
    if (pointerClick(event.nativeEvent)) {
      event.preventDefault();
      queueMicrotask(() => {
        suppressClick.current = false;
      });
    }
  };
  function begin(
    event: Parameters<NonNullable<CheckboxProps["onPointerDown"]>>[0],
    key?: Key,
  ) {
    const current = latest.current;
    if (event.isPrimary && event.pointerType === "touch" && !gesture.current)
      suppressClick.current = false;
    if (
      current.disabled ||
      event.button !== 0 ||
      !event.isPrimary ||
      !["mouse", "pen"].includes(event.pointerType) ||
      (key !== undefined &&
        (current.isItemDisabled?.(key) || !current.items.includes(key)))
    )
      return;
    stop();
    event.preventDefault();
    const input = event.currentTarget;
    input.focus({ preventScroll: true });
    suppressClick.current = true;
    const document = input.ownerDocument;
    const listeners = new AbortController();
    try {
      input.setPointerCapture(event.pointerId);
    } catch {
      /* A detached input cannot capture. */
    }
    const checked =
      key === undefined
        ? !current.items
            .filter((k) => !current.isItemDisabled?.(k))
            .every((k) => current.selected.has(k))
        : !current.selected.has(key);
    let x = event.clientX,
      y = event.clientY;
    const pointerId = event.pointerId;
    const currentGesture = {
      items: [...current.items],
      start: key,
      last: key === undefined ? -1 : current.items.indexOf(key),
      checked,
      cleanup: () => {
        listeners.abort();
        try {
          if (input.hasPointerCapture(pointerId))
            input.releasePointerCapture(pointerId);
        } catch {
          /* The row may have been removed. */
        }
      },
    };
    gesture.current = currentGesture;
    const paint = () => {
      if (gesture.current !== currentGesture || key === undefined) return;
      const hit = document
        .elementFromPoint(x, y)
        ?.closest<HTMLElement>("[data-nox-range-selection]");
      if (hit?.dataset.noxRangeSelection !== scope) return;
      const index = Number(hit.dataset.noxRangeIndex);
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= latest.current.items.length ||
        index === currentGesture.last
      )
        return;
      change(range(currentGesture.last, index), checked);
      currentGesture.last = index;
    };
    document.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerId !== pointerId) return;
        if (!(e.buttons & 1)) {
          stop();
          return;
        }
        x = e.clientX;
        y = e.clientY;
        paint();
      },
      { capture: true, signal: listeners.signal },
    );
    document.addEventListener("scroll", paint, {
      capture: true,
      passive: true,
      signal: listeners.signal,
    });
    document.addEventListener(
      "pointerup",
      (e) => {
        if (e.pointerId === pointerId) stop();
      },
      { capture: true, signal: listeners.signal },
    );
    document.addEventListener(
      "pointercancel",
      (e) => {
        if (e.pointerId === pointerId) stop();
      },
      { capture: true, signal: listeners.signal },
    );
    document.defaultView?.addEventListener("blur", () => stop(), {
      signal: listeners.signal,
    });
    if (key === undefined) {
      anchor.current = undefined;
      change(current.items, checked);
    } else activate(key, checked, event.shiftKey);
  }

  function getCheckboxProps(key: Key): RangeSelectionCheckboxProps {
    return {
      checked: options.selected.has(key),
      disabled: !!(
        options.disabled ||
        options.isItemDisabled?.(key) ||
        !indexes.has(key)
      ),
      "data-nox-range-selection": scope,
      "data-nox-range-index": indexes.get(key),
      onPointerDown: (event) => begin(event, key),
      onClick: click,
      onChange: (event) => {
        if (pointerClick(event.nativeEvent)) return;
        activate(
          key,
          event.currentTarget.checked,
          "shiftKey" in event.nativeEvent && !!event.nativeEvent.shiftKey,
        );
      },
    };
  }
  function getSelectAllProps(): RangeSelectionCheckboxProps {
    const eligible = options.items.filter(
      (key) => !options.isItemDisabled?.(key),
    );
    const count = eligible.filter((key) => options.selected.has(key)).length;
    return {
      checked: eligible.length > 0 && count === eligible.length,
      indeterminate: count > 0 && count < eligible.length,
      disabled: !!options.disabled || !eligible.length,
      onPointerDown: (event) => begin(event),
      onClick: click,
      onChange: (event) => {
        if (pointerClick(event.nativeEvent)) return;
        anchor.current = undefined;
        change(latest.current.items, event.currentTarget.checked);
      },
    };
  }
  return { getCheckboxProps, getSelectAllProps };
}
