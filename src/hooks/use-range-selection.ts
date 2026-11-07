import {
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  type HTMLAttributes,
} from "react";
import type { CheckboxProps } from "../components/checkbox/checkbox";
import { SelectionHistory, sameSelection } from "./selection-history";

export type RangeSelectionOptions<Key extends string | number> = {
  /** Unique keys in their current visible order. */
  items: readonly Key[];
  selected: ReadonlySet<Key>;
  onSelectionChange: (selected: Set<Key>) => void;
  disabled?: boolean;
  isItemDisabled?: (key: Key) => boolean;
  /** Maximum local undo commits; zero disables history. */
  historyLimit?: number;
};
export type RangeSelectionContainerProps = Pick<
  HTMLAttributes<HTMLElement>,
  "tabIndex" | "onKeyDown" | "onPointerDownCapture" | "onFocusCapture"
> & {
  "data-nox-range-container": string;
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
  const shiftHeld = useRef(false);
  const alive = useRef(true);
  const historyRef = useRef<SelectionHistory<Key> | null>(null);
  const history = (historyRef.current ??= new SelectionHistory<Key>());
  const [, refreshHistory] = useReducer((value) => value + 1, 0);
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
    finishCommit();
  }
  function checkpoint() {
    return { selected: latest.current.selected, anchor: anchor.current };
  }
  function startCommit() {
    if (alive.current && !latest.current.disabled) history.begin(checkpoint());
  }
  function finishCommit() {
    if (
      alive.current &&
      !gesture.current &&
      !shiftHeld.current &&
      history.commit(checkpoint())
    )
      refreshHistory();
  }
  function prepareActivation(shift: boolean) {
    if (!shift && shiftHeld.current) {
      shiftHeld.current = false;
      shiftRange.current = undefined;
      stop();
    }
    startCommit();
    if (shift) shiftHeld.current = true;
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
    shiftHeld.current = false;
    stop();
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
          !shiftHeld.current
        ) {
          startCommit();
          shiftHeld.current = true;
          shiftRange.current = snapshot();
        }
      },
      { capture: true, signal: abort.signal },
    );
    document.addEventListener(
      "keyup",
      (event) => {
        if (event.key === "Shift" && !event.shiftKey) {
          shiftHeld.current = false;
          shiftRange.current = undefined;
          finishCommit();
        }
      },
      { capture: true, signal: abort.signal },
    );
    document.defaultView?.addEventListener(
      "blur",
      () => {
        shiftRange.current = undefined;
        shiftHeld.current = false;
        stop();
      },
      { signal: abort.signal },
    );
  }
  useLayoutEffect(() => {
    const external = !sameSelection(latest.current.selected, options.selected);
    latest.current = options;
    if (external) {
      const changed = history.clear();
      shiftHeld.current = false;
      shiftRange.current = undefined;
      anchor.current = undefined;
      stop();
      if (changed) refreshHistory();
    }
    if (history.setLimit(options.historyLimit)) refreshHistory();
    if (anchor.current !== undefined && !indexes.has(anchor.current)) {
      anchor.current = undefined;
      shiftRange.current = undefined;
      shiftHeld.current = false;
    }
    if (options.disabled) {
      shiftRange.current = undefined;
      shiftHeld.current = false;
    }
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
    finishCommit();
  });
  useLayoutEffect(() => {
    alive.current = true;
    if (documentBinding.current) bindDocument(documentBinding.current.document);
    return () => {
      alive.current = false;
      history.clear();
      stop();
      shiftHeld.current = false;
      shiftRange.current = undefined;
      documentBinding.current?.abort.abort();
    };
  }, []);

  function publish(next: Set<Key>) {
    const current = latest.current;
    if (sameSelection(next, current.selected)) return;
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
    prepareActivation(event.shiftKey);
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
        const shift =
          "shiftKey" in event.nativeEvent && !!event.nativeEvent.shiftKey;
        prepareActivation(shift);
        activate(key, event.currentTarget.checked, shift);
        finishCommit();
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
        prepareActivation(
          "shiftKey" in event.nativeEvent && !!event.nativeEvent.shiftKey,
        );
        anchor.current = undefined;
        shiftRange.current = undefined;
        change(latest.current.items, event.currentTarget.checked);
        finishCommit();
      },
    };
  }
  function navigateHistory(redo: boolean) {
    if (latest.current.disabled || !history.enabled) return false;
    shiftHeld.current = false;
    shiftRange.current = undefined;
    stop();
    const entry = redo ? history.redo() : history.undo();
    if (!entry) return false;
    const target = redo ? entry.after : entry.before;
    const current = latest.current;
    const next = new Set(current.selected);
    for (const key of current.items) {
      if (
        current.isItemDisabled?.(key) ||
        entry.before.selected.has(key) === entry.after.selected.has(key)
      )
        continue;
      if (target.selected.has(key)) next.add(key);
      else next.delete(key);
    }
    anchor.current =
      target.anchor !== undefined && current.items.includes(target.anchor)
        ? target.anchor
        : undefined;
    publish(next);
    refreshHistory();
    return true;
  }
  function clearHistory() {
    const changed = history.clear();
    shiftHeld.current = false;
    shiftRange.current = undefined;
    stop();
    if (changed) refreshHistory();
  }
  function scopedTarget(event: {
    target: EventTarget;
    currentTarget: HTMLElement;
  }) {
    const target = event.target as Element;
    return typeof target.closest === "function" &&
      event.currentTarget.contains(target) &&
      target.closest("[data-nox-range-container]") === event.currentTarget
      ? target
      : undefined;
  }
  function getContainerProps(): RangeSelectionContainerProps {
    return {
      "data-nox-range-container": scope,
      tabIndex: -1,
      onFocusCapture: (event) => {
        if (scopedTarget(event))
          bindDocument(event.currentTarget.ownerDocument);
      },
      onPointerDownCapture: (event) => {
        const target = scopedTarget(event);
        if (!target) return;
        bindDocument(event.currentTarget.ownerDocument);
        const interactive = target.closest(
          'input,button,a,textarea,select,[contenteditable],[role="textbox"],[tabindex]',
        );
        if (!interactive || interactive === event.currentTarget)
          event.currentTarget.focus({ preventScroll: true });
      },
      onKeyDown: (event) => {
        if (
          event.defaultPrevented ||
          event.altKey ||
          !(event.ctrlKey || event.metaKey) ||
          event.key.toLowerCase() !== "z" ||
          latest.current.disabled ||
          !history.enabled
        )
          return;
        const target = scopedTarget(event);
        if (
          !target ||
          target.closest(
            'textarea,select,[contenteditable="true"],[contenteditable=""],[role="textbox"],input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"])',
          )
        )
          return;
        event.preventDefault();
        event.stopPropagation();
        navigateHistory(event.shiftKey);
      },
    };
  }
  const pending = history.hasPendingChange(options.selected);
  return {
    getCheckboxProps,
    getSelectAllProps,
    getContainerProps,
    undo: () => navigateHistory(false),
    redo: () => navigateHistory(true),
    clearHistory,
    canUndo: !options.disabled && (history.canUndo || pending),
    canRedo: !options.disabled && history.canRedo && !pending,
  };
}
