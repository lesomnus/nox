# Button variants

```tsx
<Button>More options</Button>
<Button variant="solid">Save changes</Button>
<Button variant="outline">Cancel</Button>
<Button effect="none">Without ink</Button>
<Button effectOptions={{ color: [0.4, 0.65, 1, 0.12], duration: 1200 }}>
  Custom ink
</Button>
```

- `default`: transparent until hovered, for quiet actions.
- `solid`: neutral filled surface, for actions that need more presence.
- `outline`: transparent surface with a thin inset border.
- `toolbar`: existing compact icon-button dimensions.

`default`, `solid` and `outline` share dimensions and label alignment. The inset
border adds no width or padding. All variants share keyboard focus, native
disabled behavior, the pressed content scale and the controlled `loading` state.
`effect` defaults to `"sparkle"`; `"none"` disables the ink and uses the variant's
pressed background. Sparkle starts at the pointer position or keyboard center,
holds while pressed, and fades on release, cancellation, blur or loss of window
visibility. Release outside the button keeps native click cancellation intact.
No canvas is allocated before interaction. Disabled/loading buttons do not start
ink; changing either state releases existing ink so it can finish. Switching the
effect off clears active overlays immediately. A quick press/release still plays
the remaining expansion and fade to completion.

The neutral ink follows the theme. `effectOptions` accepts `color` (normalized
RGBA), `duration`, `centerMotion` and `seed`. Color's alpha controls ink strength;
white sparkles retain Flutter's original appearance. Effects never intercept
input, resize the button, scale with the label, or cover its text and icons.
Expanded ink stops drawing; completed overlays release their GPU resources.
Caller event handlers remain active, and preventing default on pointer/key down
also prevents the ink. Native form submission, refs and keyboard activation are
preserved.

Filled and outlined variants have distinct hover and, with `effect="none"`,
pressed backgrounds. With sparkle, the background stays at its existing
normal/hover color so the ink supplies the pressed highlight.
Colors follow the dark/light shade tokens; no brand color is implied.
Hover backgrounds ease in and out; reduced motion removes that transition.

Customize the semantic tokens on a root or container:

| Role                       | Token                                   |
| -------------------------- | --------------------------------------- |
| Default/toolbar hover      | `--ui-button-hover-background`          |
| Background transition      | `--ui-button-background-duration`       |
| Solid background           | `--ui-button-solid-background`          |
| Solid hover background     | `--ui-button-solid-hover-background`    |
| Solid pressed background   | `--ui-button-solid-active-background`   |
| Outline border             | `--ui-button-outline-border`            |
| Outline hover border       | `--ui-button-outline-hover-border`      |
| Outline hover background   | `--ui-button-outline-hover-background`  |
| Outline pressed background | `--ui-button-outline-active-background` |

Text and icons inherit the host color. Storybook **Button → Variants** compares
normal, loading and disabled states; **Solid** and **Outline** allow interactive
prop controls.
**No Effect**, **Custom Ink** and **Effect Interaction** demonstrate opting out,
customizing playback and preserving event/form/ref behavior.
