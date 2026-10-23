# Origin

Nox was extracted from `lesomnus/cxz`, commit
`ab50ce0fab0c03290e4e618ea3557963cfe302a0` (2026-10-14).

The initial snapshot contains the committed `ts/packages/ui` sources, independent
UI Storybook, UI browser tests and portable unit tests. Application code and
in-progress workspace edits are outside this snapshot.

The package name, Monaco theme prefix and standalone tooling were adapted for
this repository. The original cxz workspace was left in place.

## Subsequent syncs

- 2026-10-14: imported the three `dialog-card` files from cxz commit
  `794ac755337d4703e9b1181a473bf3a0607de719`. Dialog bodies now use the control
  inset on both sides while preserving heading/text alignment and nested radii.
  Application-specific resource panels remain in cxz.

- 2026-10-14: imported the post-extraction value-menu fixes, matched-query
  highlighting and shared brand token/export from cxz main. These preserve the
  consuming application's existing behavior when switching to Nox.

- 2026-10-23: adapted cxz-only Checkbox, CopyButton, IdentifierValue, DateTime,
  FieldLabel, ResourceFields and ResourcePanel from cxz commit
  `f4183676659983ea8157fb75adcf7cc90237fc17`. The latter two become
  DescriptionList and NavigationPanel. API timestamp types, application i18n,
  unread-session tracking and global CSS hooks remain in cxz. Added standalone
  styles, native-label/ref support, clipboard feedback, composition stories and
  browser regressions. No cxz files or dependency pointers were changed.

- 2026-10-23: adapted the user-supplied Diamond Stipple Aurora Metaballs HTML
  wallpaper into StippleBackground. Preserved its paired metaballs, same-color
  smooth union, grain patterns and compressed edge falloff. Added React props,
  container sizing, palette uniforms, deterministic motion, bounded drawing,
  lifecycle cleanup, automatic pausing and context fallback/restoration.

- 2026-10-23: ported Flutter InkSparkle from flutter/flutter commit
  `457d49bc600142ecb927f382cf20a728af186ea7`. The original fragment shader is
  vendored unchanged in `src/components/switch/ink-sparkle.frag`; its Dart
  animation and uniforms are ported to TypeScript. WebGL2 adapts the backend
  bindings. Flutter's copyright and BSD license are retained in
  `docs/flutter-LICENSE.txt`, included in package distributions. See
  `docs/switch.md` for integration details and the original source links.
