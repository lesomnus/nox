# ButtonAnchor

Use `ButtonAnchor` for navigation with the same surface, press scale and default
InkSparkle feedback as `Button`. It renders a native `<a>`, accepts anchor props
and forwards its ref. `PanelItemAnchor` composes it for panel navigation.

```tsx
import { ButtonAnchor, PanelItemAnchor } from "@lesomnus/nox";

<ButtonAnchor href="/projects">Projects</ButtonAnchor>
<PanelItemAnchor href="/sessions/example" aria-current="page">
  Example session
</PanelItemAnchor>
```

Both accept `variant`, `pressTarget`, `effect="none"` and `effectOptions`.
Enter activates a link; Space retains native scrolling. Modified clicks, new tabs,
`target`, `download` and router event handlers retain native anchor behavior.
Preventing pointer/key down also prevents that press's ink. `aria-disabled` blocks
ink and click activation without changing the element into a button. Ink holds
while pressed, releases on pointer/key up, cancel or blur, and respects reduced
motion. Navigation is never delayed to finish the effect.

`LinkButton` remains the inline text-link component with a trailing decoration.
