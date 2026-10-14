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
