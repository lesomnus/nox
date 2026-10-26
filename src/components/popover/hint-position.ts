export type PopoverPosition =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

type Frame = Pick<
  DOMRect,
  "top" | "bottom" | "left" | "right" | "width" | "height"
>;

/** Prefer the requested side, then flip and shift enough to stay on screen. */
export function hintPosition(
  anchor: Frame,
  box: Pick<DOMRect, "width" | "height">,
  placement: PopoverPosition,
  viewport: { width: number; height: number },
  gap: number,
): { top: number; left: number } {
  let [side, align = "center"] = placement.split("-");
  const vertical = side === "top" || side === "bottom";
  const before = (vertical ? anchor.top : anchor.left) - 2 * gap;
  const after =
    (vertical
      ? viewport.height - anchor.bottom
      : viewport.width - anchor.right) -
    2 * gap;
  const size = vertical ? box.height : box.width;
  const towardStart = side === "top" || side === "left";
  if (
    size > (towardStart ? before : after) &&
    (towardStart ? after > before : before > after)
  ) {
    side = vertical
      ? towardStart
        ? "bottom"
        : "top"
      : towardStart
        ? "right"
        : "left";
  }
  const aligned = (start: number, end: number, size: number) =>
    align === "start"
      ? start
      : align === "end"
        ? end - size
        : (start + end - size) / 2;
  const left = vertical
    ? aligned(anchor.left, anchor.right, box.width)
    : side === "left"
      ? anchor.left - box.width - gap
      : anchor.right + gap;
  const top = vertical
    ? side === "top"
      ? anchor.top - box.height - gap
      : anchor.bottom + gap
    : aligned(anchor.top, anchor.bottom, box.height);
  return {
    left: Math.max(gap, Math.min(viewport.width - box.width - gap, left)),
    top: Math.max(gap, Math.min(viewport.height - box.height - gap, top)),
  };
}
