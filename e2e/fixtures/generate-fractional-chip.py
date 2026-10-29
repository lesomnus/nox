from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

font = FontBuilder(1000, isTTF=True)
widths = {"cell": 550, "space": 222, "figure": 550, "narrow": 200,
          "hair": 100, "en": 500, "third": 333, "quarter": 250, "sixth": 166}
names = [".notdef", *widths]
font.setupGlyphOrder(names)
characters = {code: "cell" for code in range(33, 127)}
characters.update({32: "space", 0xa0: "space", 0x2007: "figure",
                   0x202f: "narrow", 0x2009: "narrow", 0x200a: "hair",
                   0x2002: "en", 0x2004: "third", 0x2005: "quarter", 0x2006: "sixth"})
font.setupCharacterMap(characters)
glyphs = {name: TTGlyphPen(None).glyph() for name in names}
pen = TTGlyphPen(None)
pen.moveTo((60, 0))
pen.lineTo((490, 0))
pen.lineTo((490, 700))
pen.lineTo((60, 700))
pen.closePath()
glyphs["cell"] = pen.glyph()
font.setupGlyf(glyphs)
font.setupHorizontalMetrics({name: (widths.get(name, 550), 0) for name in names})
font.setupHorizontalHeader(ascent=800, descent=-200)
font.setupNameTable({"familyName": "Chip Fractional Fixture", "styleName": "Regular",
                    "uniqueFontIdentifier": "ChipFractionalFixture",
                    "fullName": "Chip Fractional Fixture", "psName": "ChipFractionalFixture"})
font.setupOS2(sTypoAscender=800, sTypoDescender=-200, usWinAscent=800, usWinDescent=200)
font.setupPost()
font.setupMaxp()
font.font.recalcTimestamp = False
font.font["head"].created = font.font["head"].modified = 3660681600
font.font.flavor = "woff"
font.save(Path(__file__).with_name("fractional-chip.woff"))
