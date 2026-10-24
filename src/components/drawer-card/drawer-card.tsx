import type { ComponentProps } from "react";
import { DialogCard } from "../dialog-card/dialog-card";
import styles from "./drawer-card.module.css";

/** The inset, rounded task-detail card. Drawer supplies placement and modal behavior. */
export function DrawerCard({
  className = "",
  ...props
}: ComponentProps<typeof DialogCard>) {
  return <DialogCard {...props} className={`${styles.card} ${className}`} />;
}
