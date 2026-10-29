`fractional-chip.woff` is an original synthetic test font. Its ASCII glyphs are simple rectangles with deliberately fractional advances. It verifies that chip geometry does not accidentally depend on an integer-width system font. It is used only by browser tests, never by the library or its Storybook examples.

Regenerate with `python generate-fractional-chip.py` after installing FontTools in a development environment.
