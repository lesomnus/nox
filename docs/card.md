# Card

`Card` is the shared visual surface for inline content, dialogs and drawers.
It provides a compact heading, rounded inset body, optional close button and
optional footer. It has no portal, placement, animation or modal behavior.

```tsx
import { Button, Card, CardActions } from "@lesomnus/nox";

<Card
  title="Workspace information"
  close={close}
  closeLabel="Close information"
  footer={
    <CardActions>
      <Button variant="solid">Save</Button>
      <Button>Cancel</Button>
    </CardActions>
  }
>
  {content}
</Card>;
```

The title is required; `hideHeading` omits its row when the host provides another
heading. `close` enables a close button; provide its accessible name using
`closeLabel`. `footer` accepts arbitrary caller-owned content, including custom
buttons and pending/error state. `CardActions` groups actions on the right and
leaves each Button's variant unchanged. Native section attributes, `style`,
`className`, section refs and `bodyTabIndex` are forwarded.

When the body is the first child (a headerless Card), its top inset matches the
horizontal body inset using the same control-inset token. This is space between
the body surface and Card frame, independent of `bodyPadding`.

By default, height follows content. `fill` fills a bounded parent's height and
turns the body into a flex column with clipped overflow. Compose Nox ScrollArea
inside for long content; the heading and footer stay fixed. `bodyPadding` only
changes body padding and accepts CSS padding strings or a number of pixels.
The default keeps the standard dialog text alignment and vertical spacing.
For the compact task-detail card inside Drawer:

```tsx
<Drawer
  open={open}
  onClose={close}
  width={360}
  height={300}
  aria-label="Task details"
>
  <Card
    title="Task details"
    fill
    bodyPadding="var(--ui-space)"
    close={close}
    closeLabel="Close details"
  >
    <ScrollArea style={{ flex: 1, minHeight: 0 }}>{content}</ScrollArea>
  </Card>
</Drawer>
```

Card uses the standard Nox dialog surface/body/input color, blur, radius, padding
and control-inset tokens. Dialog shares the same Card surface styles and adds
its modal boundary and composed content parts. Drawer accepts Card or any other
surface. Consumers need no application stylesheet or provider.

`DialogCard` and `DrawerCard` were consolidated into Card; `DialogActions` became
CardActions. The former component exports are removed. When migrating a drawer,
use `fill bodyPadding="var(--ui-space)"` to preserve its previous compact layout.

See **Components/Card** for standalone, form, filled scrolling and custom-padding
examples, and **Components/Drawer** for directional placement.
