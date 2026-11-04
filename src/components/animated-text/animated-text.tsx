import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import {
  characterDelays,
  flipPath,
  flipStepTimings,
  isFlipCharacter,
  textDirection,
  slidePath,
  type TextMotionOptions,
  type TextFlipEasing,
} from "./text-motion";
import styles from "./animated-text.module.css";
import { cancelWhenHidden } from "./motion-visibility";

export type {
  TextMotion,
  TextDirection,
  TextMotionOptions,
  TextFlipEasing,
  TextCharacterDelay,
  TextCharacterDelayContext,
} from "./text-motion";

export type AnimatedTextProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
> &
  TextMotionOptions & {
    value: string | number;
    /** Semantic numeric value, used for direction when formatted fields wrap. */
    comparisonValue?: number;
    /** Visual starting text for animateInitial; sampled once at mount. Defaults to blank cells. */
    initialValue?: string;
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
  delays: number[];
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
  characterDelay = 0,
  animateInitial = false,
  initialValue,
  shouldAnimate,
  maxSlideSteps = 1,
  maxFlipSteps = 1,
  flipEasing = "ease-in-out",
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
  const root = useRef<HTMLSpanElement>(null);
  const previous = useRef({
    text: animateInitial
      ? (initialValue ?? " ".repeat(Array.from(text).length))
      : text,
    order: comparisonValue,
  });
  const order = useRef(comparisonValue);
  const delayOption = useRef(characterDelay);
  const animateOption = useRef(shouldAnimate);
  const sequence = useRef(0);
  const [transition, setTransition] = useState<Transition>();
  // Order can change between display ticks without interrupting a transition.
  useLayoutEffect(() => {
    order.current = comparisonValue;
  }, [comparisonValue]);
  // Inline callbacks may change identity on any host render. Sample the latest
  // callback only when a new value transitions; do not restart an active one.
  useLayoutEffect(() => {
    delayOption.current = characterDelay;
    animateOption.current = shouldAnimate;
  }, [characterDelay, shouldAnimate]);
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { text, order: order.current };
    if (
      before.text === text ||
      motion === "none" ||
      reduced ||
      milliseconds === 0 ||
      (root.current && animateOption.current?.(root.current) === false)
    ) {
      setTransition(undefined);
      return;
    }
    const id = ++sequence.current;
    const from = Array.from(before.text);
    if (motion === "slide")
      while (from.length < Array.from(text).length) from.push(" ");
    const physicalDirection = textDirection(
      direction,
      before.text,
      text,
      before.order,
      order.current,
    );
    const delays = characterDelays(
      before.text,
      text,
      motion,
      delayOption.current,
      flipCharacters,
    );
    setTransition({
      from,
      delays,
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
          : Array.from(text, (character, index) =>
              slidePath(
                from[index] ?? " ",
                character,
                physicalDirection,
                maxSlideSteps,
              ),
            ),
      to: text,
      direction: physicalDirection,
      id,
    });
    const timer = setTimeout(
      () => {
        setTransition((active) => (active?.id === id ? undefined : active));
      },
      milliseconds +
        delays.reduce((longest, delay) => Math.max(longest, delay), 0),
    );
    return () => clearTimeout(timer);
  }, [
    text,
    motion,
    direction,
    milliseconds,
    reduced,
    maxSlideSteps,
    maxFlipSteps,
    flipEasing,
    flipCharacters,
  ]);
  useEffect(() => {
    if (!transition || !root.current || !shouldAnimate) return;
    const id = transition.id;
    return cancelWhenHidden(root.current, () =>
      setTransition((current) => (current?.id === id ? undefined : current)),
    );
  }, [transition?.id, shouldAnimate]);

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
      ref={root}
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
                motion === "flip" && isFlipCharacter(character, flipCharacters);
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
                  data-slide-steps={
                    animate && motion === "slide"
                      ? active.paths[index].length
                      : undefined
                  }
                  style={
                    animate
                      ? ({
                          "--animated-text-delay": `${active.delays[index]}ms`,
                        } as CSSProperties)
                      : undefined
                  }
                >
                  <span className={styles.glyph}>{character}</span>
                  {animate && (
                    <Fragment key={active.id}>
                      {motion === "slide" ? (
                        <SlideFrames
                          from={old!}
                          path={active.paths[index]}
                          duration={milliseconds}
                          delay={active.delays[index]}
                        />
                      ) : (
                        <FlipFrames
                          from={old!}
                          path={active.paths[index]}
                          duration={milliseconds}
                          easing={flipEasing}
                          delay={active.delays[index]}
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

function SlideFrames({
  from,
  path,
  duration,
  delay,
}: {
  from: string;
  path: string[];
  duration: number;
  delay: number;
}) {
  const style = {
    "--animated-text-duration": `${duration}ms`,
    "--animated-text-delay": `${delay}ms`,
    "--animated-slide-distance": `${path.length * 100}%`,
  } as CSSProperties;
  // One strip crosses every intermediate digit on the same animation timeline.
  // No per-step easing, React commit or timer can pause at a digit boundary.
  if (path.length > 1)
    return (
      <span
        className={`${styles.layer} ${styles.slide_strip}`}
        style={style}
        data-slide-strip
      >
        {[from, ...path].map((character, index) => (
          <span
            key={index}
            className={`${styles.layer} ${styles.slide_frame}`}
            style={
              {
                "--animated-slide-position": `${-index * 100}%`,
              } as CSSProperties
            }
            data-slide-frame={index}
          >
            {character}
          </span>
        ))}
      </span>
    );
  return (
    <>
      <span
        className={`${styles.layer} ${styles.outgoing}`}
        style={style}
        data-slide-frame={0}
      >
        {from}
      </span>
      <span
        className={`${styles.layer} ${styles.incoming}`}
        style={style}
        data-slide-frame={1}
      >
        {path[0]}
      </span>
    </>
  );
}

/** Each character fits its own distance-dependent flips inside the shared duration. */
function FlipFrames({
  from,
  path,
  duration,
  delay,
  easing,
}: {
  from: string;
  path: string[];
  duration: number;
  delay: number;
  easing: TextFlipEasing;
}) {
  const [step, setStep] = useState(0);
  const timings = useMemo(
    () => flipStepTimings(path.length, duration, easing),
    [path.length, duration, easing],
  );
  useLayoutEffect(() => {
    const timers = timings
      .slice(1)
      .map(({ start }, index) =>
        setTimeout(() => setStep(index + 1), delay + start),
      );
    return () => timers.forEach(clearTimeout);
  }, [timings, delay]);
  const previous = step === 0 ? from : path[step - 1];
  const next = path[step];
  return (
    <span
      className={styles.flip_frames}
      data-flip-step={step + 1}
      style={
        {
          "--animated-text-duration": `${timings[step].duration}ms`,
          "--animated-text-delay": `${step === 0 ? delay : 0}ms`,
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
