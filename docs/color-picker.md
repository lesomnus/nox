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

## Compose your own layout

Core also exports `ColorPickerRoot`, `ColorPickerArea`, `ColorPickerHue` and
`ColorPickerOpacity` with their corresponding `*Props` types.

```tsx
import {
  ColorPickerRoot,
  ColorPickerArea,
  ColorPickerHue,
  ColorPickerOpacity,
} from "@lesomnus/nox";

<ColorPickerRoot
  label="Accent color"
  value={color}
  onChange={setColor}
  style={{ display: "grid", width: 260, gap: 12 }}
>
  <ColorPickerArea style={{ height: 180 }} />
  <div style={{ display: "grid", gap: 12 }}>
    <ColorPickerHue />
    <ColorPickerOpacity />
  </div>
</ColorPickerRoot>;
```

- `ColorPickerRoot` renders a native fieldset and owns shared color state,
  group labeling, paste handling, hidden form fields and uncontrolled reset.
  It has no prescribed layout, width, padding or visible border. Use native
  `className`/`style` to define your grid/flex layout and surface.
- `ColorPickerArea` renders the saturation/brightness plane, selection marker
  and assistive controls. It fills the available width and defaults to 160px
  high; native div styles, events and ref are supported.
- `ColorPickerHue` and `ColorPickerOpacity` render native input ranges.
  `orientation="horizontal"` is the default; `orientation="vertical"` runs
  from bottom to top. Horizontal rails fill their container's width; vertical
  rails default to the plane-height token. Override dimensions with style/CSS.
  Their refs point to the actual native inputs. Range bounds, step and value
  are owned by the picker; the parts accept native events and accessibility
  attributes. Cancel `onChange` with `preventDefault()` to reject a range edit.
- All parts must be descendants of a Root, including through ordinary wrappers
  or your own React components. Reorder them, add caller-owned labels/previews,
  or omit either rail. Omission preserves the current hue/opacity channel;
  separate Roots maintain independent state. No visible label/readout is added.

Root `disabled`/`readOnly`, localized `labels`, validation state and descriptions
are shared with every part. Individual rails can additionally be disabled or
read-only. Area pointer/keyboard handlers run before built-in behavior and can
cancel it with `preventDefault()`.

The original `ColorPicker` is a convenience composition of these same parts,
with the plane on the left and two vertical rails on the right. Its API and
appearance remain unchanged. Use Root and parts for a custom layout.

## Values and interaction

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
range controls expose both axes separately to assistive technology. Pointer
capture and touch-action allow dragging beyond the field's bounds without
scrolling the page.

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
readout; those elements are not provided by ColorPicker. Horizontal, CustomLayout,
AreaOnly, ComposedForm and IndependentRoots demonstrate the public parts.
