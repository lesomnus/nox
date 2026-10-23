import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { InkSparkle, type InkSparkleProps } from "../ink-sparkle/ink-sparkle";
import styles from "./button.module.css";

export type ButtonEffectOptions = Pick<
  InkSparkleProps,
  "color" | "duration" | "centerMotion" | "seed"
>;
type Burst = {
  id: number;
  origin: readonly [number, number];
  color: NonNullable<InkSparkleProps["color"]>;
  pressed: boolean;
};
type Contact = { id: number; pointer?: number; key?: string };

function neutralColor(button: HTMLButtonElement): Burst["color"] {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [1, 1, 1, 0.06];
  const style = getComputedStyle(button);
  context.fillStyle =
    style.getPropertyValue("--ui-shade-255").trim() || style.color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255, (a / 255) * 0.06];
}

export function useButtonSparkle(
  enabled: boolean,
  blocked: boolean,
  options?: ButtonEffectOptions,
) {
  const serial = useRef(0);
  const held = useRef<Contact | undefined>(undefined);
  const detach = useRef<(() => void) | undefined>(undefined);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const release = () => {
    const id = held.current?.id;
    held.current = undefined;
    detach.current?.();
    detach.current = undefined;
    if (id !== undefined)
      setBursts((current) =>
        current.map((burst) =>
          burst.id === id ? { ...burst, pressed: false } : burst,
        ),
      );
  };
  const begin = (
    button: HTMLButtonElement,
    origin: Burst["origin"],
    source: Omit<Contact, "id">,
  ) => {
    if (!enabled || blocked || held.current) return;
    const id = ++serial.current;
    held.current = { id, ...source };
    const color = options?.color ?? neutralColor(button);
    setBursts((current) => [
      ...current.slice(-3),
      { id, origin, color, pressed: true },
    ]);
    const pointerEnd = (event: globalThis.PointerEvent) => {
      if (held.current?.pointer === event.pointerId) release();
    };
    const keyEnd = (event: globalThis.KeyboardEvent) => {
      if (held.current?.key === event.key) release();
    };
    const hide = () => {
      if (document.hidden) release();
    };
    window.addEventListener("pointerup", pointerEnd, true);
    window.addEventListener("pointercancel", pointerEnd, true);
    window.addEventListener("keyup", keyEnd, true);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", hide);
    detach.current = () => {
      window.removeEventListener("pointerup", pointerEnd, true);
      window.removeEventListener("pointercancel", pointerEnd, true);
      window.removeEventListener("keyup", keyEnd, true);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", hide);
    };
  };
  useEffect(() => () => detach.current?.(), []);
  useEffect(() => {
    if (!enabled) {
      held.current = undefined;
      detach.current?.();
      detach.current = undefined;
      setBursts((current) => (current.length ? [] : current));
    } else if (blocked) release();
  }, [enabled, blocked]);

  return {
    pointerDown(event: PointerEvent<HTMLButtonElement>) {
      if (event.button !== 0 || !event.isPrimary) return;
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      begin(
        button,
        [
          ((event.clientX - rect.left) / rect.width) * button.offsetWidth -
            button.clientLeft,
          ((event.clientY - rect.top) / rect.height) * button.offsetHeight -
            button.clientTop,
        ],
        { pointer: event.pointerId },
      );
    },
    pointerEnd(event: PointerEvent<HTMLButtonElement>) {
      if (held.current?.pointer === event.pointerId) release();
    },
    keyDown(event: KeyboardEvent<HTMLButtonElement>) {
      if (event.repeat || !["Enter", " "].includes(event.key)) return;
      const button = event.currentTarget;
      begin(button, [button.clientWidth / 2, button.clientHeight / 2], {
        key: event.key,
      });
    },
    keyUp(event: KeyboardEvent<HTMLButtonElement>) {
      if (held.current?.key === event.key) release();
    },
    release,
    ink: enabled
      ? bursts.map(({ id, origin, color, pressed }) => (
          <InkSparkle
            {...options}
            key={id}
            duration={options?.duration ?? 1200}
            color={options?.color ?? color}
            origin={origin}
            pressed={pressed}
            className={styles.button_ink}
            onComplete={() =>
              setBursts((current) => current.filter((burst) => burst.id !== id))
            }
          />
        ))
      : null,
  };
}
