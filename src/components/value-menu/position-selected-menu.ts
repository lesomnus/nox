const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/** Position a real option over the value, with edge placement when it cannot fit. */
export function positionSelectedMenu(
  popup: HTMLElement,
  trigger: HTMLElement,
  minMenuWidth: number,
) {
  const list = popup.querySelector<HTMLElement>(".setting-options");
  const option = popup.querySelector<HTMLElement>(
    '[role="option"][aria-selected="true"]',
  );
  const label = option?.querySelector<HTMLElement>(".setting-match-label");
  const value = trigger.querySelector<HTMLElement>(".meta-value");
  if (!list || !option || !label || !value) return false;

  const css = getComputedStyle(popup);
  // CSS positioning and scroll offsets use unzoomed pixels, while client
  // rectangles include CSS zoom. Keep all geometry in the popup's CSS space.
  const zoom =
    popup.currentCSSZoom ||
    popup.getBoundingClientRect().width / parseFloat(css.width) ||
    1;
  const rect = (node: HTMLElement) => {
    const bounds = node.getBoundingClientRect();
    return {
      top: bounds.top / zoom,
      bottom: bounds.bottom / zoom,
      left: bounds.left / zoom,
      width: bounds.width / zoom,
      height: bounds.height / zoom,
    };
  };
  const viewportWidth = window.innerWidth / zoom;
  const viewportHeight = window.innerHeight / zoom;
  const edge =
    parseFloat(css.getPropertyValue("--ui-menu-viewport-inset")) || 0;
  const topInset = parseFloat(css.paddingTop) + parseFloat(css.borderTopWidth);
  const bottomInset =
    parseFloat(css.paddingBottom) + parseFloat(css.borderBottomWidth);
  const leftInset =
    parseFloat(css.paddingLeft) + parseFloat(css.borderLeftWidth);
  const rightInset =
    parseFloat(css.paddingRight) + parseFloat(css.borderRightWidth);
  const bounds = rect(trigger);
  // The popup is portaled, so Form's control sizing is not inherited there.
  // Size only the selected replacement; surrounding choices keep menu spacing.
  const control = getComputedStyle(trigger);
  popup.style.setProperty("--selected-option-width", `${bounds.width}px`);
  popup.style.setProperty("--selected-option-height", `${bounds.height}px`);
  for (const side of ["Top", "Right", "Bottom", "Left"] as const)
    popup.style.setProperty(
      `--selected-option-padding-${side.toLowerCase()}`,
      `${parseFloat(control[`padding${side}`]) + parseFloat(control[`border${side}Width`])}px`,
    );
  const width = Math.max(0, viewportWidth - 2 * edge);
  popup.style.setProperty(
    "--menu-width",
    `${Math.min(width, Math.max(bounds.width + leftInset + rightInset, minMenuWidth))}px`,
  );
  popup.style.left = `${clamp(bounds.left - leftInset, edge, viewportWidth - edge - rect(popup).width)}px`;
  popup.style.bottom = "auto";
  popup.style.top = `${edge}px`;

  const header = popup.querySelector<HTMLElement>('[data-menu-fixed="header"]');
  const footer = popup.querySelector<HTMLElement>('[data-menu-fixed="footer"]');
  const before = topInset + (header ? rect(header).height : 0);
  const after = bottomInset + (footer ? rect(footer).height : 0);
  const available = Math.max(0, viewportHeight - 2 * edge - before - after);
  popup.style.setProperty("--options-height", `${available}px`);

  const anchor = rect(value);
  const center = anchor.top + anchor.height / 2;
  const row = rect(option);
  const text = rect(label);
  // Align the actual text, including any icon beside the label.
  popup.style.left = `${clamp(parseFloat(popup.style.left) + anchor.left - text.left, edge, viewportWidth - edge - rect(popup).width)}px`;
  const contentCenter =
    text.top + text.height / 2 - rect(list).top + list.scrollTop;
  const above = Math.min(contentCenter, center - edge - before);
  const below = Math.min(
    list.scrollHeight - contentCenter,
    viewportHeight - edge - center - after,
  );
  const height = Math.max(0, Math.min(rect(list).height, above + below));
  const rows =
    parseFloat(css.getPropertyValue("--ui-menu-align-min-rows")) || 1;
  const minimum = Math.min(list.scrollHeight, row.height * rows);

  // scrollHeight is integer-rounded; viewport/row bounds retain subpixels.
  // A fitting short list must not fall back just because its height rounded up.
  const fitsMinimum = height >= minimum - 0.5;
  if (above >= row.height / 2 && below >= row.height / 2 && fitsMinimum) {
    const visibleAbove = clamp(
      height / 2,
      Math.max(0, height - below),
      Math.min(height, above),
    );
    popup.style.setProperty("--options-height", `${height}px`);
    list.scrollTop = contentCenter - visibleAbove;
    const actual = rect(label);
    popup.style.top = `${center - (actual.top + actual.height / 2 - rect(popup).top)}px`;
    const frame = rect(popup);
    const selected = rect(option);
    popup.style.setProperty(
      "--menu-reveal-top",
      `${Math.max(0, selected.top - frame.top - topInset)}px`,
    );
    popup.style.setProperty(
      "--menu-reveal-bottom",
      `${Math.max(0, frame.bottom - selected.bottom - bottomInset)}px`,
    );
    popup.dataset.itemAlignment = "selected";
    return true;
  }

  const gap = parseFloat(css.getPropertyValue("--ui-space")) || 0;
  const spaceAbove = clamp(
    bounds.top - edge - gap,
    0,
    viewportHeight - 2 * edge,
  );
  const spaceBelow = clamp(
    viewportHeight - edge - bounds.bottom - gap,
    0,
    viewportHeight - 2 * edge,
  );
  const upwards = spaceAbove > spaceBelow;
  popup.style.setProperty(
    "--options-height",
    `${Math.max(0, (upwards ? spaceAbove : spaceBelow) - before - after)}px`,
  );
  const popupHeight = rect(popup).height;
  popup.style.top = `${clamp(upwards ? bounds.top - gap - popupHeight : bounds.bottom + gap, edge, viewportHeight - edge - popupHeight)}px`;
  option.scrollIntoView({ block: "nearest" });
  popup.dataset.itemAlignment = "edge";
  return false;
}
