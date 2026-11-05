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

type RangeSnapshot<Key> = {
  before: ReadonlySet<Key>;
  affected: Set<Key>;
  anchor?: Key;
  checked?: boolean;
};

/** Controlled, reversible checkbox ranges, independent of table markup. */
export function useRangeSelection<Key extends string | number>(
  options: RangeSelectionOptions<Key>,
) {
  const scope = useId();
  const latest = useRef(options);
  const anchor = useRef<Key | undefined>(undefined);
  const shiftRange = useRef<RangeSnapshot<Key> | undefined>(undefined);
  const documentBinding = useRef<
    { document: Document; abort: AbortController } | undefined
  >(undefined);
  const suppressClick = useRef(false);
  const gesture = useRef<
    | {
        items: readonly Key[];
        start?: Key;
        last: number;
        snapshot?: RangeSnapshot<Key>;
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
  function snapshot(start = anchor.current): RangeSnapshot<Key> {
    return {
      before: new Set(latest.current.selected),
      affected: new Set(),
      anchor: start,
    };
  }
  function bindDocument(document: Document) {
    if (
      documentBinding.current?.document === document &&
      !documentBinding.current.abort.signal.aborted
    )
      return;
    documentBinding.current?.abort.abort();
    shiftRange.current = undefined;
    const abort = new AbortController();
    documentBinding.current = { document, abort };
    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Shift" &&
          !latest.current.disabled &&
          !shiftRange.current
        )
          shiftRange.current = snapshot();
      },
      { capture: true, signal: abort.signal },
    );
    document.addEventListener(
      "keyup",
      (event) => {
        if (event.key === "Shift" && !event.shiftKey)
          shiftRange.current = undefined;
      },
      { capture: true, signal: abort.signal },
    );
    document.defaultView?.addEventListener(
      "blur",
      () => {
        shiftRange.current = undefined;
        stop();
      },
      { signal: abort.signal },
    );
  }
  useLayoutEffect(() => {
    latest.current = options;
    if (anchor.current !== undefined && !indexes.has(anchor.current)) {
      anchor.current = undefined;
      shiftRange.current = undefined;
    }
    if (options.disabled) shiftRange.current = undefined;
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
  useLayoutEffect(() => {
    if (documentBinding.current) bindDocument(documentBinding.current.document);
    return () => {
      stop();
      shiftRange.current = undefined;
      documentBinding.current?.abort.abort();
    };
  }, []);

  function publish(next: Set<Key>) {
    const current = latest.current;
    if (
      next.size === current.selected.size &&
      [...next].every((key) => current.selected.has(key))
    )
      return;
    // Pointer events can arrive before the controlled render commits.
    latest.current = { ...current, selected: next };
    current.onSelectionChange(next);
  }

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
    publish(next);
  }
  function range(from: number, to: number) {
    return latest.current.items.slice(
      Math.min(from, to),
      Math.max(from, to) + 1,
    );
  }
  function preview(currentRange: RangeSnapshot<Key>, keys: readonly Key[]) {
    const current = latest.current;
    if (current.disabled) return;
    const available = new Set(current.items);
    const next = new Set(current.selected);
    const set = (key: Key, checked: boolean) => {
      if (!available.has(key) || current.isItemDisabled?.(key)) return;
      if (checked) next.add(key);
      else next.delete(key);
    };
    for (const key of currentRange.affected)
      set(key, currentRange.before.has(key));
    for (const key of keys) set(key, currentRange.checked!);
    currentRange.affected = new Set(keys);
    publish(next);
  }
  function activate(key: Key, checked: boolean, shift: boolean) {
    const current = latest.current;
    if (current.disabled || current.isItemDisabled?.(key)) return;
    const to = current.items.indexOf(key);
    if (to < 0) return;
    let currentRange: RangeSnapshot<Key>;
    if (shift) {
      currentRange = shiftRange.current ??= snapshot();
      if (
        currentRange.anchor === undefined ||
        !current.items.includes(currentRange.anchor)
      ) {
        currentRange.anchor = key;
        anchor.current = key;
      }
      currentRange.checked ??= !currentRange.before.has(key);
    } else {
      shiftRange.current = undefined;
      anchor.current = key;
      currentRange = snapshot(key);
      currentRange.checked = checked;
    }
    preview(
      currentRange,
      range(current.items.indexOf(currentRange.anchor!), to),
    );
    return currentRange;
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
    bindDocument(event.currentTarget.ownerDocument);
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
    const currentGesture: NonNullable<typeof gesture.current> = {
      items: [...current.items],
      start: key,
      last: key === undefined ? -1 : current.items.indexOf(key),
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
      if (gesture.current !== currentGesture || !currentGesture.snapshot)
        return;
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
      const from = latest.current.items.indexOf(
        currentGesture.snapshot.anchor!,
      );
      if (from < 0) return;
      preview(currentGesture.snapshot, range(from, index));
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
    if (key === undefined) {
      anchor.current = undefined;
      shiftRange.current = undefined;
      change(current.items, checked);
    } else currentGesture.snapshot = activate(key, checked, event.shiftKey);
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
        bindDocument(event.currentTarget.ownerDocument);
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
        bindDocument(event.currentTarget.ownerDocument);
        anchor.current = undefined;
        shiftRange.current = undefined;
        change(latest.current.items, event.currentTarget.checked);
      },
    };
  }
  return { getCheckboxProps, getSelectAllProps };
}
