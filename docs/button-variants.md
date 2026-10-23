# Button variants

```tsx
<Button>More options</Button>
<Button variant="solid">Save changes</Button>
<Button variant="outline">Cancel</Button>
```

- `default`: transparent until hovered, for quiet actions.
- `solid`: neutral filled surface, for actions that need more presence.
- `outline`: transparent surface with a thin inset border.
- `toolbar`: existing compact icon-button dimensions.

`default`, `solid` and `outline` share dimensions and label alignment. The inset
border adds no width or padding. All variants share keyboard focus, native
disabled behavior, the pressed content scale and the controlled `loading` state.
Filled and outlined variants also have distinct hover and pressed backgrounds.
Colors follow the dark/light shade tokens; no brand color is implied.

Customize the semantic tokens on a root or container:

| Role                       | Token                                   | Default          |
| -------------------------- | --------------------------------------- | ---------------- |
| Solid background           | `--ui-button-solid-background`          | `--ui-shade-43`  |
| Solid hover background     | `--ui-button-solid-hover-background`    | `--ui-shade-54`  |
| Solid pressed background   | `--ui-button-solid-active-background`   | `--ui-shade-65`  |
| Outline border             | `--ui-button-outline-border`            | `--ui-shade-72`  |
| Outline hover border       | `--ui-button-outline-hover-border`      | `--ui-shade-115` |
| Outline hover background   | `--ui-button-outline-hover-background`  | `--ui-shade-28`  |
| Outline pressed background | `--ui-button-outline-active-background` | `--ui-shade-38`  |

Text and icons inherit the host color. Storybook **Button → Variants** compares
normal, loading and disabled states; **Solid** and **Outline** allow interactive
prop controls.
