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
  const edge =
    parseFloat(css.getPropertyValue("--ui-menu-viewport-inset")) || 0;
  const topInset = parseFloat(css.paddingTop) + parseFloat(css.borderTopWidth);
  const bottomInset =
    parseFloat(css.paddingBottom) + parseFloat(css.borderBottomWidth);
  const leftInset =
    parseFloat(css.paddingLeft) + parseFloat(css.borderLeftWidth);
  const rightInset =
    parseFloat(css.paddingRight) + parseFloat(css.borderRightWidth);
  const bounds = trigger.getBoundingClientRect();
  const width = Math.max(0, window.innerWidth - 2 * edge);
  popup.style.setProperty(
    "--menu-width",
    `${Math.min(width, Math.max(bounds.width + leftInset + rightInset, minMenuWidth))}px`,
  );
  popup.style.left = `${clamp(bounds.left - leftInset, edge, window.innerWidth - edge - popup.getBoundingClientRect().width)}px`;
  popup.style.bottom = "auto";
  popup.style.top = `${edge}px`;

  const header = popup.querySelector<HTMLElement>('[data-menu-fixed="header"]');
  const footer = popup.querySelector<HTMLElement>('[data-menu-fixed="footer"]');
  const before = topInset + (header?.getBoundingClientRect().height ?? 0);
  const after = bottomInset + (footer?.getBoundingClientRect().height ?? 0);
  const available = Math.max(0, window.innerHeight - 2 * edge - before - after);
  popup.style.setProperty("--options-height", `${available}px`);

  const anchor = value.getBoundingClientRect();
  const center = anchor.top + anchor.height / 2;
  const row = option.getBoundingClientRect();
  const text = label.getBoundingClientRect();
  // Form controls can use different padding from the portaled option rows.
  // Align the text itself rather than assuming the two frames share an inset.
  popup.style.left = `${clamp(parseFloat(popup.style.left) + anchor.left - text.left, edge, window.innerWidth - edge - popup.getBoundingClientRect().width)}px`;
  const contentCenter =
    text.top +
    text.height / 2 -
    list.getBoundingClientRect().top +
    list.scrollTop;
  const above = Math.min(contentCenter, center - edge - before);
  const below = Math.min(
    list.scrollHeight - contentCenter,
    window.innerHeight - edge - center - after,
  );
  const height = Math.max(
    0,
    Math.min(list.getBoundingClientRect().height, above + below),
  );
  const rows =
    parseFloat(css.getPropertyValue("--ui-menu-align-min-rows")) || 1;
  const minimum = Math.min(list.scrollHeight, row.height * rows);

  if (above >= row.height / 2 && below >= row.height / 2 && height >= minimum) {
    const visibleAbove = clamp(
      height / 2,
      Math.max(0, height - below),
      Math.min(height, above),
    );
    popup.style.setProperty("--options-height", `${height}px`);
    list.scrollTop = contentCenter - visibleAbove;
    const actual = label.getBoundingClientRect();
    popup.style.top = `${center - (actual.top + actual.height / 2 - popup.getBoundingClientRect().top)}px`;
    const frame = popup.getBoundingClientRect();
    const selected = option.getBoundingClientRect();
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
    window.innerHeight - 2 * edge,
  );
  const spaceBelow = clamp(
    window.innerHeight - edge - bounds.bottom - gap,
    0,
    window.innerHeight - 2 * edge,
  );
  const upwards = spaceAbove > spaceBelow;
  popup.style.setProperty(
    "--options-height",
    `${Math.max(0, (upwards ? spaceAbove : spaceBelow) - before - after)}px`,
  );
  const popupHeight = popup.getBoundingClientRect().height;
  popup.style.top = `${clamp(upwards ? bounds.top - gap - popupHeight : bounds.bottom + gap, edge, window.innerHeight - edge - popupHeight)}px`;
  option.scrollIntoView({ block: "nearest" });
  popup.dataset.itemAlignment = "edge";
  return false;
}
