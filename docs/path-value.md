# PathValue

A copyable path that removes middle directories before shortening the leaf. It measures rendered glyphs and the actual ellipsis, keeps root/separator semantics for Unix and Windows paths, and truncates only at grapheme boundaries. ResizeObserver remeasures as available width or fonts change.

`value` is the full original path. `label` names the copy action. An optional `onCopy` and `copying` let a host own clipboard feedback; otherwise the component copies the original path. Hover or focus shows an in-place Popover containing the entire value. Give the surrounding layout a bounded width and `min-width: 0`.
