import { useId, type CSSProperties } from "react";
import styles from "./switch.module.css";

export function Switch({
  label,
  checked,
  disabled = false,
  pending = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  /** Keep checked at the current value while its opposite is being applied. */
  pending?: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  const filterId = `switch-ripple-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const seed =
    (Array.from(id).reduce((value, char) => value + char.charCodeAt(0), 0) %
      97) +
    1;
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      data-pending={pending || undefined}
      disabled={disabled}
      className={styles.switch_control}
      style={
        pending
          ? ({
              "--switch-ripple-filter": `url("#${filterId}")`,
            } as CSSProperties)
          : undefined
      }
      onClick={() => {
        if (!pending) onChange(!checked);
      }}
    >
      <span aria-hidden="true" />
      {pending && (
        <svg
          className={styles.filter_definitions}
          aria-hidden="true"
          focusable="false"
          width="0"
          height="0"
        >
          <defs>
            <filter
              id={filterId}
              x="-15%"
              y="-15%"
              width="130%"
              height="130%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.11 0.17"
                numOctaves="2"
                seed={seed}
                result="flow"
              />
              <feColorMatrix
                in="flow"
                type="matrix"
                values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.8 0.8 0.8 0 -0.5"
                result="flow_density"
              />
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65 0.8"
                numOctaves="1"
                seed={seed + 11}
                result="grain"
              />
              <feColorMatrix
                in="grain"
                type="matrix"
                values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.3 0.3 0.3 0 0.45"
                result="grain_density"
              />
              <feComposite
                in="flow_density"
                in2="grain_density"
                operator="in"
                result="density"
              />
              <feComposite
                in="SourceGraphic"
                in2="density"
                operator="in"
                result="textured_wave"
              />
              <feDisplacementMap
                in="textured_wave"
                in2="flow"
                scale="1.2"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}
    </button>
  );
}
