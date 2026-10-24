import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
} from "react";
import styles from "./aurora-glow.module.css";

export type AuroraPalette = readonly [string, string, string];
export type AuroraGlowProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  /** Bloom while active; contract while still moving when deactivated. */
  active?: boolean;
  /** Freeze movement independently of the visible active state. */
  paused?: boolean;
  palette?: AuroraPalette;
  /** Overall opacity from zero to one; omitted follows the theme token. */
  strength?: number;
  /** Motion multiplier; zero freezes movement. Does not change bloom timing. */
  speed?: number;
  /** Reproducible random waypoints; omitted chooses a seed per mount. */
  seed?: number;
};

type Drift = {
  node: HTMLElement;
  point: () => Keyframe;
  frame: Keyframe;
  duration: number;
  animation?: Animation;
};

/** Decorative, clipped layer. The host supplies size, glass and foreground content. */
export function AuroraGlow({
  active = true,
  paused = false,
  palette,
  strength,
  speed = 1,
  seed,
  className = "",
  style,
  ref,
  ...props
}: AuroraGlowProps) {
  const root = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => root.current!, []);
  const [randomSeed] = useState(() => Math.floor(Math.random() * 4294967296));
  const resolvedSeed =
    seed !== undefined && Number.isFinite(seed) ? seed : randomSeed;
  const rate = Number.isFinite(speed) ? Math.max(0, speed) : 1;
  const latest = useRef({ active, paused, rate });
  latest.current = { active, paused, rate };
  const control = useRef<{ sync: () => void } | undefined>(undefined);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let randomState = resolvedSeed >>> 0;
    const random = () => {
      randomState = (randomState + 0x6d2b79f5) >>> 0;
      let value = randomState;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
    const between = (min: number, max: number) => min + random() * (max - min);
    const timing = (token: string) => {
      const value = getComputedStyle(node).getPropertyValue(token).trim();
      const duration = parseFloat(value) * (value.endsWith("ms") ? 1 : 1000);
      return Number.isFinite(duration) ? Math.max(0, duration) : 0;
    };
    const motions: Drift[] = [];
    let running = false,
      disposed = false,
      visible = true,
      wasActive = false,
      endingAt = 0,
      release = 0;

    function add(
      part: string,
      token: string,
      frame: Keyframe,
      point: () => Keyframe,
    ) {
      const duration = timing(token);
      if (!duration) return;
      for (const element of node!.querySelectorAll<HTMLElement>(
        `[data-aurora-part="${part}"]`,
      ))
        motions.push({
          node: element,
          point,
          frame,
          duration: duration * between(0.8, 1.2),
        });
    }
    add(
      "cluster",
      "--ui-aurora-drift-duration",
      { transform: "translate3d(0, 0, 0)" },
      () => ({
        transform: `translate3d(${between(-16, 16)}%, ${between(-32, 32)}%, 0)`,
      }),
    );
    add(
      "orb",
      "--ui-aurora-form-duration",
      { transform: "scale(1)", opacity: 0.7 },
      () => {
        const vanished = random() < 0.2;
        return {
          transform: `rotate(${between(-55, 55)}deg) scale(${vanished ? 0.025 : between(0.3, 1.55)}, ${vanished ? 0.025 : between(0.35, 1.65)})`,
          opacity: vanished ? 0 : between(0.3, 0.85),
        };
      },
    );
    add(
      "hotspot",
      "--ui-aurora-focus-duration",
      { transform: "translate3d(0, 0, 0) scale(1)" },
      () => ({
        transform: `translate3d(${between(-32, 32)}%, ${between(-32, 32)}%, 0) scale(${between(0.3, 1.15)})`,
      }),
    );

    function wander(motion: Drift) {
      const frames = [motion.frame, ...Array.from({ length: 5 }, motion.point)];
      motion.animation?.cancel();
      motion.animation = motion.node.animate(
        frames.map((frame) => ({ ...frame, easing: "ease-in-out" })),
        { duration: motion.duration * between(0.85, 1.15), fill: "forwards" },
      );
      motion.animation.playbackRate = latest.current.rate;
      motion.frame = frames.at(-1)!;
      void motion.animation.finished.then(
        () => {
          if (!disposed && running) wander(motion);
        },
        () => {},
      );
    }
    function sync() {
      if (disposed) return;
      clearTimeout(release);
      const state = latest.current;
      const time = performance.now();
      if (state.active !== wasActive) {
        const envelope = node!.querySelector('[data-aurora-part="envelope"]');
        if (envelope) getComputedStyle(envelope).transform;
        endingAt = state.active
          ? 0
          : time + timing("--ui-aurora-envelope-duration");
        wasActive = state.active;
      }
      if (reduced.matches) endingAt = 0;
      node!.dataset.active = String(state.active);
      const closing = endingAt > time;
      running =
        (state.active || closing) &&
        !state.paused &&
        state.rate > 0 &&
        !reduced.matches &&
        !document.hidden &&
        visible &&
        typeof node!.animate === "function";
      node!.dataset.running = String(running);
      for (const orbit of node!.querySelectorAll<HTMLElement>(
        '[data-aurora-part="orbit"]',
      ))
        for (const animation of orbit.getAnimations?.() ?? [])
          animation.playbackRate = state.rate || 1;
      for (const motion of motions) {
        if (reduced.matches) {
          motion.animation?.cancel();
          motion.animation = undefined;
        } else if (running) {
          if (!motion.animation || motion.animation.playState === "finished")
            wander(motion);
          else {
            motion.animation.playbackRate = state.rate;
            motion.animation.play();
          }
        } else motion.animation?.pause();
      }
      if (!state.active && closing && !reduced.matches)
        release = window.setTimeout(sync, Math.max(0, endingAt - time));
    }
    const visibility = () => sync();
    const observer =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(([entry]) => {
            if (!entry) return;
            visible = entry.isIntersecting;
            sync();
          })
        : undefined;
    observer?.observe(node);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", visibility);
    control.current = { sync };
    sync();
    return () => {
      disposed = true;
      control.current = undefined;
      clearTimeout(release);
      observer?.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", visibility);
      node.dataset.running = "false";
      for (const motion of motions) motion.animation?.cancel();
    };
  }, [resolvedSeed]);
  useEffect(() => control.current?.sync(), [active, paused, rate]);

  return (
    <div
      {...props}
      ref={root}
      className={`${styles.root} ${className}`}
      style={
        {
          ...(palette && {
            "--ui-aurora-color-1": palette[0],
            "--ui-aurora-color-2": palette[1],
            "--ui-aurora-color-3": palette[2],
          }),
          ...(strength !== undefined &&
            Number.isFinite(strength) && {
              "--ui-aurora-strength": Math.max(0, Math.min(1, strength)),
            }),
          ...style,
        } as CSSProperties
      }
      data-aurora-glow
      data-active="false"
      data-running="false"
      aria-hidden="true"
    >
      <div className={styles.field}>
        {[0, 1, 2].map((cluster) => (
          <div
            className={styles.cluster}
            key={cluster}
            data-aurora-part="cluster"
          >
            <div className={styles.envelope} data-aurora-part="envelope">
              {[0, 1, 2].map((color) => (
                <div
                  className={styles.orbit}
                  key={color}
                  data-aurora-part="orbit"
                >
                  <div
                    className={styles.orb}
                    data-aurora-part="orb"
                    style={
                      {
                        "--orb-color": `var(--ui-aurora-color-${color + 1})`,
                      } as CSSProperties
                    }
                  >
                    <span
                      className={styles.hotspot}
                      data-aurora-part="hotspot"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
