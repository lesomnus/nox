import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { textDirection, type TextMotionOptions } from "./text-motion";
import styles from "./animated-text.module.css";

export type {
  TextMotion,
  TextDirection,
  TextMotionOptions,
} from "./text-motion";

export type AnimatedTextProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
> &
  TextMotionOptions & {
    value: string | number;
    /** Semantic numeric value, used for direction when formatted fields wrap. */
    comparisonValue?: number;
    characterClassName?: (
      character: string,
      index: number,
      text: string,
    ) => string | undefined;
  };

let media: MediaQueryList | undefined;
function motionPreference() {
  return typeof window === "undefined" || !window.matchMedia
    ? undefined
    : (media ??= window.matchMedia("(prefers-reduced-motion: reduce)"));
}
function subscribeMotion(callback: () => void) {
  const query = motionPreference();
  query?.addEventListener("change", callback);
  return () => query?.removeEventListener("change", callback);
}
function reducedMotion() {
  return motionPreference()?.matches ?? false;
}
const serverMotion = () => true;
const noMotionSubscription = () => () => {};

type Transition = {
  from: string[];
  to: string;
  direction: "up" | "down";
  id: number;
};

/** Controlled presentation only: the host owns the clock, price or counter. */
export function AnimatedText({
  value,
  motion = "slide",
  direction = "auto",
  duration = 360,
  comparisonValue,
  characterClassName,
  className = "",
  style,
  ...props
}: AnimatedTextProps) {
  const text = String(value);
  const milliseconds = Number.isFinite(duration) ? Math.max(0, duration) : 360;
  const reduced = useSyncExternalStore(
    motion === "none" ? noMotionSubscription : subscribeMotion,
    reducedMotion,
    serverMotion,
  );
  const previous = useRef({ text, order: comparisonValue });
  const order = useRef(comparisonValue);
  const sequence = useRef(0);
  const [transition, setTransition] = useState<Transition>();
  // Order can change between display ticks without interrupting a transition.
  useLayoutEffect(() => {
    order.current = comparisonValue;
  }, [comparisonValue]);
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { text, order: order.current };
    if (
      before.text === text ||
      motion === "none" ||
      reduced ||
      milliseconds === 0
    ) {
      setTransition(undefined);
      return;
    }
    const id = ++sequence.current;
    setTransition({
      from: Array.from(before.text),
      to: text,
      direction: textDirection(
        direction,
        before.text,
        text,
        before.order,
        order.current,
      ),
      id,
    });
    const timer = setTimeout(() => {
      setTransition((active) => (active?.id === id ? undefined : active));
    }, milliseconds);
    return () => clearTimeout(timer);
  }, [text, motion, direction, milliseconds, reduced]);

  const active =
    motion !== "none" && !reduced && transition?.to === text
      ? transition
      : undefined;
  // Static consumers need only styled runs, not a DOM cell for every character.
  const runs: { value: string; className?: string }[] = [];
  if (motion === "none") {
    Array.from(text).forEach((character, index) => {
      const className = characterClassName?.(character, index, text);
      const last = runs.at(-1);
      if (last && last.className === className) last.value += character;
      else runs.push({ value: character, className });
    });
  }
  return (
    <span
      {...props}
      role={props.role ?? "img"}
      aria-label={props["aria-label"] ?? text}
      className={`${styles.text} ${className}`}
      style={
        {
          ...style,
          "--animated-text-duration": `${milliseconds}ms`,
        } as CSSProperties
      }
      data-motion={motion}
    >
      <span aria-hidden="true">
        {motion === "none"
          ? runs.map((run, index) => (
              <span key={index} className={run.className}>
                {run.value}
              </span>
            ))
          : Array.from(text, (character, index) => {
              const old = active?.from[index];
              const changing = old !== undefined && old !== character;
              const card = motion === "flip" && /[\p{L}\p{N}]/u.test(character);
              const animate =
                !!active && changing && (motion !== "flip" || card);
              return (
                <span
                  key={index}
                  className={`${styles.cell} ${characterClassName?.(character, index, text) ?? ""}`}
                  data-motion={
                    card ? "flip" : motion === "slide" ? "slide" : "none"
                  }
                  data-changing={animate || undefined}
                  data-direction={active?.direction}
                >
                  <span className={styles.glyph}>{character}</span>
                  {animate && (
                    <Fragment key={active.id}>
                      {motion === "slide" ? (
                        <>
                          <span
                            className={`${styles.layer} ${styles.outgoing}`}
                          >
                            {old}
                          </span>
                          <span
                            className={`${styles.layer} ${styles.incoming}`}
                          >
                            {character}
                          </span>
                        </>
                      ) : (
                        <>
                          <span
                            className={`${styles.layer} ${styles.half} ${styles.resting}`}
                          >
                            <span>{old}</span>
                          </span>
                          <span
                            className={`${styles.layer} ${styles.half} ${styles.fold_out}`}
                          >
                            <span>{old}</span>
                          </span>
                          <span
                            className={`${styles.layer} ${styles.half} ${styles.fold_in}`}
                          >
                            <span>{character}</span>
                          </span>
                        </>
                      )}
                    </Fragment>
                  )}
                </span>
              );
            })}
      </span>
    </span>
  );
}
