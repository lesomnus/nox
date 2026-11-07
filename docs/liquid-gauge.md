# LiquidGauge

A narrow tube with an inset, concave liquid surface and smooth shoulders near a full vessel. `value` is a remaining percentage, clamped to the supported range. An absent value renders an unknown state. The component supplies meter semantics; pass `aria-label` and optionally `aria-valuetext` for domain-specific language.

Children are centered over the liquid, so callers can use CompactNumber or their own label. `tint` and the liquid CSS variables control color, dimensions and motion. A quota adapter should own thresholds, data fetching, reset time and refresh policy. It should never recreate the contour or tube layers.
