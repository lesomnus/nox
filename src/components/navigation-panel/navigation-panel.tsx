import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { ScrollArea, type ScrollAreaProps } from "../scroll-area/scroll-area";
import styles from "./navigation-panel.module.css";

const TitleContext = createContext<
  Dispatch<SetStateAction<string | undefined>> | undefined
>(undefined);
export type NavigationPanelRootProps = ComponentPropsWithRef<"aside">;
export type NavigationPanelHeaderProps = ComponentPropsWithRef<"header">;
export type NavigationPanelTitleProps = ComponentPropsWithRef<"strong">;
export type NavigationPanelActionsProps = ComponentPropsWithRef<"div">;
export type NavigationPanelBodyProps = ComponentPropsWithRef<"div">;
export type NavigationPanelFooterProps = ComponentPropsWithRef<"footer">;
export type NavigationPanelScrollBodyProps = ScrollAreaProps;
export type NavigationPanelProps = Omit<NavigationPanelRootProps, "title"> & {
  title: ReactNode;
  actions?: ReactNode;
  scrollAreaProps?: Omit<ScrollAreaProps, "children">;
};

export function NavigationPanelRoot({
  className = "",
  ...props
}: NavigationPanelRootProps) {
  const [title, setTitle] = useState<string>();
  return (
    <TitleContext value={setTitle}>
      <aside
        aria-labelledby={props["aria-label"] ? undefined : title}
        {...props}
        className={`${styles.panel} ${className}`}
      />
    </TitleContext>
  );
}
export function NavigationPanelHeader({
  className = "",
  ...props
}: NavigationPanelHeaderProps) {
  return <header {...props} className={`${styles.header} ${className}`} />;
}
export function NavigationPanelTitle({
  id,
  className = "",
  ...props
}: NavigationPanelTitleProps) {
  const generated = useId();
  const titleId = id ?? generated;
  const register = useContext(TitleContext);
  useLayoutEffect(() => {
    register?.(titleId);
    return () =>
      register?.((current) => (current === titleId ? undefined : current));
  }, [register, titleId]);
  return (
    <strong
      {...props}
      id={titleId}
      className={`${styles.title} ${className}`}
    />
  );
}
export function NavigationPanelActions({
  className = "",
  ...props
}: NavigationPanelActionsProps) {
  return <div {...props} className={`${styles.actions} ${className}`} />;
}
/** Non-scrolling body. Use ScrollBody when an internal viewport is needed. */
export function NavigationPanelBody({
  className = "",
  ...props
}: NavigationPanelBodyProps) {
  return (
    <div
      {...props}
      className={`${styles.body} ${styles.content} ${styles.plainBody} ${className}`}
    />
  );
}
export function NavigationPanelScrollBody({
  className = "",
  contentClassName = "",
  ...props
}: NavigationPanelScrollBodyProps) {
  return (
    <ScrollArea
      {...props}
      className={`${styles.body} ${className}`}
      contentClassName={`${styles.content} ${contentClassName}`}
    />
  );
}
export function NavigationPanelFooter({
  className = "",
  ...props
}: NavigationPanelFooterProps) {
  return <footer {...props} className={`${styles.footer} ${className}`} />;
}

export function NavigationPanel({
  title,
  actions,
  children,
  scrollAreaProps,
  ...props
}: NavigationPanelProps) {
  return (
    <NavigationPanelRoot {...props}>
      <NavigationPanelHeader>
        <NavigationPanelTitle>{title}</NavigationPanelTitle>
        {actions && <NavigationPanelActions>{actions}</NavigationPanelActions>}
      </NavigationPanelHeader>
      <NavigationPanelScrollBody {...scrollAreaProps}>
        {children}
      </NavigationPanelScrollBody>
    </NavigationPanelRoot>
  );
}
