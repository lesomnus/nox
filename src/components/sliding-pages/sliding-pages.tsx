import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
  type RefObject,
} from "react";
import styles from "./sliding-pages.module.css";

export type SlidingPageProps = ComponentProps<"div"> & {
  value: string;
  /** Used only when focus moves from the outgoing page. */
  initialFocus?: RefObject<HTMLElement | null>;
};
export type SlidingPagesProps = Omit<ComponentProps<"div">, "children"> & {
  value: string;
  children: ReactElement<SlidingPageProps> | ReactElement<SlidingPageProps>[];
  /** none requires a caller-sized viewport; height keeps its available width. */
  resize?: "none" | "height" | "both";
  orientation?: "horizontal" | "vertical";
  /** External navigation keeps its focus. No focus moves on initial mount. */
  focusOnChange?: boolean;
};
type PagesContext = {
  value: string;
  previousValue: string;
  order: string[];
  register: (value: string, node: HTMLDivElement | null) => void;
};
const Context = createContext<PagesContext | null>(null);

/** A controlled, clipped page viewport. Navigation and validation belong to the host. */
export function SlidingPages({
  value,
  children,
  resize = "height",
  orientation = "horizontal",
  focusOnChange = true,
  className = "",
  style,
  ref,
  onFocusCapture,
  onBlurCapture,
  ...props
}: SlidingPagesProps) {
  const pages = Children.toArray(children).map((child) => {
    if (!isValidElement<SlidingPageProps>(child) || child.type !== SlidingPage)
      throw new Error("SlidingPages expects direct SlidingPage children");
    return child;
  });
  const order = pages.map((page) => page.props.value);
  if (new Set(order).size !== order.length)
    throw new Error("SlidingPage values must be unique");
  const signature = JSON.stringify(order);
  const root = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const previous = useRef(value);
  const focused = useRef<string | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  useImperativeHandle(ref, () => root.current!, []);
  const register = useCallback((key: string, node: HTMLDivElement | null) => {
    if (node) nodes.current.set(key, node);
    else nodes.current.delete(key);
  }, []);

  useLayoutEffect(() => {
    if (resize === "none") return;
    const viewport = root.current!;
    const page = nodes.current.get(value);
    if (!page) {
      setSize({ width: 0, height: 0 });
      return;
    }
    const parent = viewport.parentElement;
    let parentWidth = -1;
    const number = (text: string) => parseFloat(text) || 0;
    const measure = () => {
      const css = getComputedStyle(viewport);
      const chromeWidth =
        number(css.paddingLeft) +
        number(css.paddingRight) +
        number(css.borderLeftWidth) +
        number(css.borderRightWidth);
      const chromeHeight =
        number(css.paddingTop) +
        number(css.paddingBottom) +
        number(css.borderTopWidth) +
        number(css.borderBottomWidth);
      if (parent) {
        const parentStyle = getComputedStyle(parent);
        parentWidth = parent.clientWidth;
        const available = Math.max(
          0,
          parentWidth -
            number(parentStyle.paddingLeft) -
            number(parentStyle.paddingRight) -
            chromeWidth,
        );
        viewport.style.setProperty(
          "--sliding-pages-available-width",
          `${available}px`,
        );
      }
      const pageStyle = getComputedStyle(page);
      const contentBox = pageStyle.boxSizing !== "border-box";
      const pageWidth =
        number(pageStyle.width) +
        (contentBox
          ? number(pageStyle.paddingLeft) +
            number(pageStyle.paddingRight) +
            number(pageStyle.borderLeftWidth) +
            number(pageStyle.borderRightWidth)
          : 0);
      const pageHeight =
        number(pageStyle.height) +
        (contentBox
          ? number(pageStyle.paddingTop) +
            number(pageStyle.paddingBottom) +
            number(pageStyle.borderTopWidth) +
            number(pageStyle.borderBottomWidth)
          : 0);
      const next = {
        width: pageWidth + chromeWidth,
        height: pageHeight + chromeHeight,
      };
      setSize((current) =>
        current &&
        Math.abs(current.width - next.width) < 0.25 &&
        Math.abs(current.height - next.height) < 0.25
          ? current
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver((entries) => {
      if (
        entries.some((entry) => entry.target === page) ||
        parent?.clientWidth !== parentWidth
      )
        measure();
    });
    observer.observe(page);
    if (parent) observer.observe(parent);
    return () => {
      observer.disconnect();
      viewport.style.removeProperty("--sliding-pages-available-width");
    };
  }, [value, resize, signature]);

  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = value;
    if (old === value || !focusOnChange || focused.current !== old) return;
    const active = document.activeElement;
    if (active !== document.body && !nodes.current.get(old)?.contains(active))
      return;
    const page = nodes.current.get(value);
    if (!page) return;
    const preferred = pages.find((item) => item.props.value === value)?.props
      .initialFocus?.current;
    (preferred && page.contains(preferred) ? preferred : page).focus({
      preventScroll: true,
    });
  }, [value, focusOnChange, signature]);

  return (
    <Context.Provider
      value={{ value, previousValue: previous.current, order, register }}
    >
      <div
        {...props}
        ref={root}
        className={`${styles.viewport} ${className}`}
        data-sliding-pages=""
        data-value={value}
        data-resize={resize}
        data-orientation={orientation}
        style={
          {
            "--sliding-pages-width":
              resize !== "none" && size ? `${size.width}px` : undefined,
            "--sliding-pages-height":
              resize !== "none" && size ? `${size.height}px` : undefined,
            ...style,
          } as CSSProperties
        }
        onFocusCapture={(event) => {
          onFocusCapture?.(event);
          focused.current =
            order.find((key) =>
              nodes.current.get(key)?.contains(event.target as Node),
            ) ?? null;
        }}
        onBlurCapture={(event) => {
          onBlurCapture?.(event);
          queueMicrotask(() => {
            if (!root.current?.contains(document.activeElement))
              focused.current = null;
          });
        }}
      >
        {pages.map((page) => cloneElement(page, { key: page.props.value }))}
      </div>
    </Context.Provider>
  );
}

/** A stable page: inactive content remains mounted, inert and hidden from accessibility. */
export function SlidingPage({
  value,
  initialFocus: _initialFocus,
  ref,
  className = "",
  style,
  ...props
}: SlidingPageProps) {
  const context = useContext(Context);
  if (!context) throw new Error("SlidingPage must be inside SlidingPages");
  const { register, order } = context;
  const active = context.value === value;
  const index = order.indexOf(context.value);
  const offset = index < 0 ? 1 : Math.sign(order.indexOf(value) - index);
  const node = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => node.current!, []);
  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      node.current = element;
      register(value, element);
    },
    [register, value],
  );
  useLayoutEffect(() => {
    if (!active || context.previousValue === value) return;
    const element = node.current!;
    const oldIndex = order.indexOf(context.previousValue);
    const direction =
      oldIndex < 0 ? 1 : Math.sign(order.indexOf(value) - oldIndex);
    const transition = element.style.transition;
    element.style.transition = "none";
    element.style.setProperty("--sliding-page-offset", String(direction));
    // A newly added target has no previous offscreen layout to transition from.
    element.getBoundingClientRect();
    element.style.transition = transition;
    element.style.setProperty("--sliding-page-offset", "0");
  }, []);
  return (
    <div
      {...props}
      ref={attach}
      className={`${styles.page} ${className}`}
      data-sliding-page={value}
      data-active={active || undefined}
      inert={!active || props.inert}
      aria-hidden={!active || props["aria-hidden"] || undefined}
      tabIndex={props.tabIndex ?? -1}
      style={{ "--sliding-page-offset": offset, ...style } as CSSProperties}
    />
  );
}
