import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { flipPath, textDirection, type TextMotionOptions } from "./text-motion";
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
  paths: string[][];
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
  maxFlipSteps = 1,
  flipCharacters,
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
    const from = Array.from(before.text);
    const physicalDirection = textDirection(
      direction,
      before.text,
      text,
      before.order,
      order.current,
    );
    setTransition({
      from,
      paths:
        motion === "flip"
          ? Array.from(text, (character, index) =>
              from[index] === undefined
                ? []
                : flipPath(
                    from[index],
                    character,
                    physicalDirection,
                    maxFlipSteps,
                    flipCharacters,
                  ),
            )
          : [],
      to: text,
      direction: physicalDirection,
      id,
    });
    const timer = setTimeout(() => {
      setTransition((active) => (active?.id === id ? undefined : active));
    }, milliseconds);
    return () => clearTimeout(timer);
  }, [
    text,
    motion,
    direction,
    milliseconds,
    reduced,
    maxFlipSteps,
    flipCharacters,
  ]);

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
              const card =
                motion === "flip" &&
                (/[\p{L}\p{N}]/u.test(character) ||
                  flipCharacters?.includes(character));
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
                  data-flip-steps={
                    animate && card ? active.paths[index].length : undefined
                  }
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
                        <FlipFrames
                          from={old!}
                          path={active.paths[index]}
                          duration={milliseconds}
                        />
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

/** Each character fits its own distance-dependent flips inside the shared duration. */
function FlipFrames({
  from,
  path,
  duration,
}: {
  from: string;
  path: string[];
  duration: number;
}) {
  const [step, setStep] = useState(0);
  useLayoutEffect(() => {
    const timers = path
      .slice(1)
      .map((_, index) =>
        setTimeout(
          () => setStep(index + 1),
          (duration * (index + 1)) / path.length,
        ),
      );
    return () => timers.forEach(clearTimeout);
  }, [path, duration]);
  const previous = step === 0 ? from : path[step - 1];
  const next = path[step];
  return (
    <span
      className={styles.flip_frames}
      data-flip-step={step + 1}
      style={
        {
          "--animated-text-duration": `${duration / path.length}ms`,
        } as CSSProperties
      }
    >
      <Fragment key={step}>
        <span className={`${styles.layer} ${styles.face}`}>{next}</span>
        <span className={`${styles.layer} ${styles.half} ${styles.resting}`}>
          <span>{previous}</span>
        </span>
        <span className={`${styles.layer} ${styles.half} ${styles.fold_out}`}>
          <span>{previous}</span>
        </span>
        <span className={`${styles.layer} ${styles.half} ${styles.fold_in}`}>
          <span>{next}</span>
        </span>
      </Fragment>
    </span>
  );
}
