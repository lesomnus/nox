const active = new WeakMap<Element, () => void>();
let observer: IntersectionObserver | undefined;

// Visibility may cancel a running reveal; entering the viewport never starts one.
export function cancelWhenHidden(element: Element, cancel: () => void) {
  if (typeof IntersectionObserver === "undefined") return () => {};
  observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries)
      if (!entry.isIntersecting) active.get(entry.target)?.();
  });
  active.set(element, cancel);
  observer.observe(element);
  return () => {
    observer?.unobserve(element);
    active.delete(element);
  };
}
