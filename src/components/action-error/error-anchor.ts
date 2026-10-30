type AnchorState = {
  open: string | null;
  highlight: string | null;
  owners: Set<string>;
  highlights: Set<string>;
};
const anchors = new WeakMap<HTMLElement, AnchorState>();

export function describeErrorAnchor(
  anchor: HTMLElement,
  id: string,
  highlight: boolean,
) {
  let state = anchors.get(anchor);
  if (!state) {
    state = {
      open: anchor.getAttribute("data-action-error-open"),
      highlight: anchor.getAttribute("data-action-error-highlight"),
      owners: new Set(),
      highlights: new Set(),
    };
    anchors.set(anchor, state);
  }
  const set = (name: string, value: string | null) => {
    if (value === null) anchor.removeAttribute(name);
    else anchor.setAttribute(name, value);
  };
  const sync = () => {
    set("data-action-error-open", state.owners.size ? "true" : state.open);
    set(
      "data-action-error-highlight",
      state.highlights.size ? "true" : state.highlight,
    );
  };
  const descriptions = () =>
    anchor.getAttribute("aria-describedby")?.split(/\s+/).filter(Boolean) ?? [];
  const existing = descriptions().includes(id);
  if (!existing)
    anchor.setAttribute("aria-describedby", [...descriptions(), id].join(" "));
  state.owners.add(id);
  if (highlight) state.highlights.add(id);
  sync();
  return () => {
    state.owners.delete(id);
    state.highlights.delete(id);
    sync();
    if (!state.owners.size) anchors.delete(anchor);
    if (existing) return;
    const remaining = descriptions().filter((token) => token !== id);
    set("aria-describedby", remaining.length ? remaining.join(" ") : null);
  };
}
