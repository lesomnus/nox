# Tabs

Controlled tabs with roving focus, disabled items, wrapping arrow-key navigation and Home/End. Horizontal navigation follows writing direction; vertical tabs use Up/Down. `items` contain labels, optional decorative `icon` slots and optional per-item `panelId` values. Use `prefix` when panel `aria-labelledby` values need stable, caller-known tab IDs.

Tabs own selection and focus behavior, while callers own content lifetime. Pair with SlidingPages for animated panels; use completion icons and CompactNumber labels for step tabs. Completion status belongs to the host, rather than the generic tab primitive.
