# RgbColorInput

Three native numeric inputs for integer sRGB channels (0–255), with a live color
swatch. Import `RgbColorInput` and the `RgbColor` type from `@lesomnus/nox`.

```tsx
const [color, setColor] = useState<RgbColor>({ r: 217, g: 255, b: 48 });

<RgbColorInput label="Accent color" value={color} onChange={setColor} />;
```

`value` makes the component controlled; `defaultValue` enables internal state.
The default is black. `onChange` receives a new `{ r, g, b }` object whenever
the effective color changes, with rounded/clamped byte values. External
non-finite channel values display as zero. No callback fires merely because
props are normalized or a form resets.

Each channel supports native typing, paste, selection and ArrowUp/ArrowDown.
Empty/incomplete drafts do not emit a color or reset to zero while editing.
Blur, Enter and Escape restore the display to the latest valid color; Enter
retains native form submission. Finite out-of-range/fractional drafts emit a
clamped/rounded channel and are formatted on blur. External channel updates
replace local drafts.

Paste a complete `#RGB`, `#RRGGBB`, `rgb(r, g, b)`, `rgb(r g b)` or three
comma/space-separated numeric channels into any input to replace all channels.
Ordinary single-channel paste stays native. Alpha, percentage, named-color and
other color-space formats are not parsed by this RGB input.

The component renders a `fieldset`. `label` names the group accessibly;
`aria-labelledby` can refer to a visible heading. Channel names default to
Red/Green/Blue; override `channelLabels={{ r: "빨강", g: "초록", b: "파랑" }}`
for localization. `disabled`, `readOnly`, native fieldset attributes, events,
style, class and ref are supported. `aria-invalid` and `aria-describedby` also
reach the individual inputs. The swatch is decorative; all channels remain
available as text.

With `name="accent"`, native form data contains `accent.r`, `accent.g` and
`accent.b`. The `form` attribute associates the inputs with an external form.
Native form reset restores `defaultValue` for uncontrolled inputs; controlled
forms should reset the caller's value. Disabled inputs do not submit; read-only
inputs do. The ref points to the fieldset, whose inputs can be queried for focus.

Appearance tokens: `--ui-color-input-background`, `--ui-color-input-border`,
`--ui-color-input-focus-border`, `--ui-color-input-hover-background`,
`--ui-color-input-error-border` and `--ui-color-input-preview-size` (26px).
Text uses the shared value/separator role tokens; colors follow the theme.

InkSparkle expects normalized RGBA rather than byte RGB. Convert explicitly
when using the input to control an effect:

```tsx
const ink = [color.r / 255, color.g / 255, color.b / 255, 0.2] as const;
```

Storybook **Components/RgbColorInput** covers controlled/uncontrolled editing,
live preview and external updates, form submission/reset, disabled/read-only,
invalid and localized states. HSV and OKLCH inputs can use their own channel
models without changing the RGB value contract.
