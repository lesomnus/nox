# ColorPicker

A graphical RGB(A) picker with a saturation/brightness gradient box, a rainbow
hue slider and an opacity slider arranged vertically to its right. Click, touch
or drag inside the box to select its shade; there are no numeric channel inputs.

```tsx
import { ColorPicker, type RgbColor } from "@lesomnus/nox";

const [color, setColor] = useState<RgbColor>({
  r: 217,
  g: 255,
  b: 48,
  a: 0.75,
});
<ColorPicker label="Accent color" value={color} onChange={setColor} />;
```

`RgbColor` has byte sRGB channels (`r`, `g`, `b`, each 0–255) and optional
`a` (opacity 0–1, defaults to 1). Every `onChange` emits a normalized `RgbaColor`
with all four channels. Values are RGB externally; HSV coordinates are private
picker state. The marker keeps its exact position across byte rounding, and
hue is retained at white/gray/black so adjusting brightness/saturation restores
the selected color family.

Use `value`/`onChange` for a controlled picker, or `defaultValue` for internal
state (opaque black by default). Hue and opacity can be changed independently;
fully transparent colors retain their RGB channels. The opacity rail uses a
checkerboard so transparency remains visible.
The component only renders the color field and these two sliders. It has no
visible titles, color swatch, HEX value or opacity readout. Compose a preview
or value display outside the picker using `value` and `onChange` when needed.

The color field is one keyboard tab stop: Left/Right adjust saturation,
Up/Down adjust brightness, Shift increases the step, Home selects white and
End selects black. Hue and opacity are native range controls with native
keyboard support: Up increases the value, Down decreases it; the minimum
is at the bottom and the maximum is at the top. Hidden saturation/brightness
range controls expose both axes separately to assistive technology. Pointer capture and touch-action
allow dragging beyond the field's bounds without scrolling the page.

The native `fieldset` supports disabled/readOnly states, class/style/ref,
`aria-invalid`, `aria-describedby`, and other fieldset attributes. `label`
names the group. Override `labels` to localize area/hue/alpha/saturation/
brightness/instructions text. These names and instructions are available
to assistive technology without visible labels.

With `name="accent"`, hidden inputs submit `accent.r`, `accent.g`, `accent.b`
and `accent.a`; `form` can associate them with an external form. Uncontrolled
form reset restores `defaultValue`. Controlled reset belongs to the caller.
A disabled picker does not submit its values; readOnly values still submit.

A focused picker also accepts pasted HEX (#RGB, #RGBA, #RRGGBB, #RRGGBBAA),
RGB/RGBA CSS functions with byte channels, or three comma/space-separated
numbers. Pasting a color without alpha uses full opacity.

Appearance uses the shared `--ui-color-input-*` border/background/error tokens,
plus `--ui-color-picker-width` (240px), `--ui-color-picker-plane-height` (160px),
`--ui-color-picker-handle-size` (12px) and checker-light/checker-dark tokens.
The color gradients use real color values in both themes.

Storybook **Components/ColorPicker** includes default, uncontrolled, translucent,
gray, black, preview/presets, form, disabled/readOnly, invalid and localized
examples. The Preview story adds its own preview, preset buttons and RGB
readout; those elements are not provided by ColorPicker.
