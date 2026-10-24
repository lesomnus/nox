import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
} from "react";
import {
  createSkeletonRegistry,
  SkeletonSurface,
  type SkeletonRegistry,
  type SkeletonSparkleOptions,
} from "./skeleton-surface";
import styles from "./skeleton.module.css";

export type { SkeletonSparkleOptions } from "./skeleton-surface";
const SkeletonContext = createContext<SkeletonRegistry | null>(null);

export type SkeletonGroupProps = ComponentPropsWithRef<"div"> & {
  animated?: boolean;
  sparkleOptions?: SkeletonSparkleOptions;
};

/** Descendant Skeletons share one spatially continuous InkSparkle surface. */
export function SkeletonGroup({
  animated = true,
  sparkleOptions,
  className = "",
  children,
  ...props
}: SkeletonGroupProps) {
  const [registry] = useState(createSkeletonRegistry);
  return (
    <div
      {...props}
      className={`${styles.group} ${className}`}
      data-skeleton="group"
    >
      <SkeletonContext.Provider value={registry}>
        {children}
      </SkeletonContext.Provider>
      {animated && (
        <SkeletonSurface registry={registry} sparkleOptions={sparkleOptions} />
      )}
    </div>
  );
}

export type SkeletonProps = Omit<ComponentPropsWithRef<"span">, "children"> & {
  variant?: "text" | "rect" | "circle";
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  animated?: boolean;
  sparkleOptions?: SkeletonSparkleOptions;
};

/** Decorative placeholder. Put loading status on the containing region. */
export function Skeleton({
  variant = "text",
  width,
  height,
  animated = true,
  sparkleOptions,
  className = "",
  style,
  ref,
  ...props
}: SkeletonProps) {
  const registry = useContext(SkeletonContext);
  const element = useRef<HTMLSpanElement>(null);
  const attach = useCallback(
    (node: HTMLSpanElement | null) => {
      element.current = node;
      if (typeof ref === "function") {
        const cleanup = ref(node);
        if (typeof cleanup === "function")
          return () => {
            element.current = null;
            cleanup();
          };
      } else if (ref) ref.current = node;
    },
    [ref],
  );
  useLayoutEffect(() => {
    if (registry && animated && element.current)
      return registry.register(element.current);
  }, [registry, animated]);
  return (
    <span
      {...props}
      ref={attach}
      aria-hidden="true"
      className={`${styles.skeleton} ${className}`}
      data-variant={variant}
      data-animated={animated || undefined}
      data-skeleton="placeholder"
      style={{ width, height, ...style }}
    >
      {animated && !registry && (
        <SkeletonSurface sparkleOptions={sparkleOptions} />
      )}
    </span>
  );
}
