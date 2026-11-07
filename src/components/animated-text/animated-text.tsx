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
    /** Fade dash/blank placeholders from this color to each character's normal color. */
    placeholderColor?: CSSProperties["color"];
    /** Semantic color per character; value changes smoothly transition between roles. */
    characterColor?: (
      character: string,
      index: number,
      text: string,
    ) => CSSProperties["color"];
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
  origins?: (SlideOrigin | undefined)[];
  paths: string[][];
  delays: number[];
  to: string;
  colorKey: string;
  direction: "up" | "down";
  id: number;
};

type SlideFrame = { character: string; offset: number };
type SlideOrigin = { frames: SlideFrame[]; anchor: SlideFrame };

/** Read the clipped, on-screen strip before replacing any of its DOM layers. */
function slideOrigins(
  element: HTMLElement | null,
  direction: "up" | "down",
): (SlideOrigin | undefined)[] {
  return Array.from(element?.firstElementChild?.children ?? [], (cell) => {
    if (!cell.matches('[data-motion="slide"][data-changing]')) return;
    const bounds = cell.getBoundingClientRect();
    if (!bounds.height) return;
    const frames = Array.from(cell.querySelectorAll("[data-slide-frame]"))
      .map((frame) => ({
        character: frame.textContent ?? " ",
        offset:
          (frame.getBoundingClientRect().top - bounds.top) / bounds.height,
      }))
      .filter((frame) => frame.offset > -0.99999 && frame.offset < 0.99999);
    if (!frames.length) return;
    // The frame nearest the new entry edge lands before any new path digits.
    const anchor = frames.reduce((entry, frame) =>
      (
        direction === "down"
          ? frame.offset < entry.offset
          : frame.offset > entry.offset
      )
        ? frame
        : entry,
    );
    return { frames, anchor };
  });
}

/** Controlled presentation only: the host owns the clock, price or counter. */
export function AnimatedText({
  value,
  motion = "slide",
  direction = "auto",
  duration = 360,
  characterDelay = 0,
  animateInitial = false,
  initialValue,
  placeholderColor,
  shouldAnimate,
  maxSlideSteps = 1,
  maxFlipSteps = 1,
  flipEasing = "ease-in-out",
  flipCharacters,
  comparisonValue,
  characterClassName,
  characterColor,
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
  const colors = characterColor
    ? Array.from(text, (character, index) =>
        characterColor(character, index, text),
      )
    : undefined;
  const colorKey = colors?.join("\0") ?? "";
  const initialText = animateInitial
    ? (initialValue ?? " ".repeat(Array.from(text).length))
    : text;
  const initialColors =
    colors &&
    Array.from(initialText, (character, index) =>
      (character === "-" || character === " ") && placeholderColor
        ? placeholderColor
        : colors[index],
    );
  const previous = useRef({
    text: initialText,
    order: comparisonValue,
    colors: initialColors,
    colorKey: initialColors?.join("\0") ?? "",
  });
  // Keep old color targets for the pre-layout commit, including while an earlier
  // CSS transition is running. Skipped motion still commits final colors before paint.
  const [displayed, setDisplayed] = useState({
    text: initialText,
    colorKey: previous.current.colorKey,
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
    previous.current = { text, order: order.current, colors, colorKey };
    if (characterColor)
      setDisplayed((old) =>
        old.text === text && old.colorKey === colorKey
          ? old
          : { text, colorKey },
      );
    if (
      (before.text === text && before.colorKey === colorKey) ||
      motion === "none" ||
      reduced ||
      milliseconds === 0 ||
      (root.current && animateOption.current?.(root.current) === false)
    ) {
      setTransition(undefined);
      return;
    }
    // Commit the old inline colors before changing their targets. Native CSS
    // transitions then also retarget smoothly when a new value interrupts one.
    if (characterColor) root.current?.getBoundingClientRect();
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
    const origins =
      motion === "slide"
        ? slideOrigins(root.current, physicalDirection)
        : undefined;
    origins?.forEach((origin, index) => {
      if (origin) from[index] = origin.anchor.character;
    });
    const delays = characterDelays(
      from.join(""),
      text,
      motion,
      delayOption.current,
      flipCharacters,
    );
    // A moving digit is already revealed. Retarget it immediately rather than
    // freezing its partial frames for another spatial/stagger delay.
    origins?.forEach((origin, index) => {
      if (origin) delays[index] = 0;
    });
    setTransition({
      from,
      origins,
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
      colorKey,
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
    colorKey,
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
    motion !== "none" && !reduced && transition ? transition : undefined;
  // Keep the old strip mounted through the pre-layout commit so its actual
  // visible positions can be sampled, instead of flashing the previous target.
  const visualText = active?.to ?? text;
  const pendingColors =
    !!characterColor &&
    (displayed.text !== text || displayed.colorKey !== colorKey);
  const colorMotion =
    !!characterColor &&
    motion !== "none" &&
    !reduced &&
    milliseconds > 0 &&
    (pendingColors || !!active);
  const displayedColors = pendingColors ? previous.current.colors : colors;
  const targetCharacters = Array.from(visualText);
  const changedDelays =
    active?.delays.filter(
      (_, index) => active.from[index] !== targetCharacters[index],
    ) ?? [];
  const firstDelay = changedDelays.length ? Math.min(...changedDelays) : 0;
  // Static consumers need only styled runs, not a DOM cell for every character.
  const runs: {
    value: string;
    className?: string;
    color?: CSSProperties["color"];
  }[] = [];
  if (motion === "none") {
    Array.from(text).forEach((character, index) => {
      const className = characterClassName?.(character, index, text);
      const color = colors?.[index];
      const last = runs.at(-1);
      if (last && last.className === className && last.color === color)
        last.value += character;
      else runs.push({ value: character, className, color });
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
              <span
                key={index}
                className={run.className}
                style={run.color ? { color: run.color } : undefined}
              >
                {run.value}
              </span>
            ))
          : Array.from(visualText, (character, index) => {
              const old = active?.from[index];
              const changing =
                old !== undefined &&
                (old !== character || !!active?.origins?.[index]);
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
                  data-color-reveal={
                    animate && placeholderColor && (old === "-" || old === " ")
                      ? true
                      : undefined
                  }
                  data-color-managed={characterColor ? true : undefined}
                  data-color-transition={colorMotion || undefined}
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
                    animate || characterColor
                      ? ({
                          color:
                            displayedColors?.[index] ??
                            (pendingColors ? placeholderColor : undefined),
                          "--animated-text-delay": `${animate ? active.delays[index] : firstDelay}ms`,
                          "--animated-text-placeholder-color": placeholderColor,
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
                          origin={active.origins?.[index]}
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
  origin,
}: {
  from: string;
  path: string[];
  duration: number;
  delay: number;
  origin?: SlideOrigin;
}) {
  const style = {
    "--animated-text-duration": `${duration}ms`,
    "--animated-text-delay": `${delay}ms`,
    "--animated-slide-distance": `${path.length * 100}%`,
  } as CSSProperties;
  if (origin) {
    return <RetargetedSlide origin={origin} path={path} style={style} />;
  }
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

function RetargetedSlide({
  origin,
  path,
  style,
}: {
  origin: SlideOrigin;
  path: string[];
  style: CSSProperties;
}) {
  // The signed distance and frame coordinates use the new direction while the
  // origin glyphs retain both fractional offsets from the interrupted strip.
  return (
    <span
      className={`${styles.layer} ${styles.slide_strip} ${styles.retargeted}`}
      style={
        {
          ...style,
          "--animated-slide-origin": `${origin.anchor.offset * 100}%`,
        } as CSSProperties
      }
      data-slide-strip
      data-slide-retarget
    >
      {origin.frames.map((frame, index) => (
        <span
          key={`origin-${index}`}
          className={styles.layer}
          style={{ transform: `translateY(${frame.offset * 100}%)` }}
          data-slide-frame={index}
        >
          {frame.character}
        </span>
      ))}
      {path.map((character, index) => (
        <span
          key={`path-${index}`}
          className={`${styles.layer} ${styles.slide_frame}`}
          style={
            {
              "--animated-slide-position": `${-(index + 1) * 100}%`,
            } as CSSProperties
          }
          data-slide-frame={origin.frames.length + index}
        >
          {character}
        </span>
      ))}
    </span>
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
