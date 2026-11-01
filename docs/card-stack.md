# CardStack

`CardStack` presents a bounded window into a keyed FIFO queue. The caller owns
the items, actions and open state; the component owns placement, presence,
stacking, body scrolling, clipping and motion. It has no approval or resource API.

```tsx
<CardStack
  items={queue}
  getKey={(item) => item.id}
  open={open}
  anchor={triggerElement}
  container={positionedContainer}
  occlusionBoundary={lowerPanel}
  renderItem={(item) => <Message item={item} />}
  getItemProps={(item) => ({ role: "region", "aria-label": item.title })}
/>
```

Remove the head item after your action succeeds. The old front shrinks and
slides behind the boundary without fading. Its successor moves forward after a
delay; retained back cards follow one slot forward and a new card rises into the
deepest slot. Existing keyed back nodes remain mounted during advancement.
Items outside the visible window are not rendered.

Opening reveals the stack front-first. Closing withdraws the deepest card first
and retains the stack until the front finishes. Covered bodies remain intact;
clipping exposes them as higher cards move, without accumulating translucent
backgrounds. `prefers-reduced-motion` disables this movement. Observers,
animation frames and fallback cleanup timers stop on unmount.

`anchor` is the element above which the stack is centered. Omit `container` for
a fixed document-body portal; pass a positioned element to keep the stack inside
one pane. An explicit `null` waits for that container to mount. Placement clamps
to the container or viewport. `occlusionBoundary` identifies the surface whose
top edge hides departing cards; it defaults to the anchor. Optional `exitTarget`
sets the fully hidden endpoint from another element's top/radius while clipping
still happens at the boundary. This lets a toolbar and its text surface share a
stack without lowering it behind unrelated overlays.

`visibleCount` includes the front and must be a positive integer. Keys returned
by `getKey` must be stable and unique. `renderItem` receives `{ depth, active,
exiting }`; render only content, since the component supplies the glass surface
and `ScrollArea`. `scrollbarLabel` names that viewport. `getItemProps` adds
identifiers, accessibility attributes and styles to each logical card root;
back and departing roots remain inert and hidden from accessibility APIs.
`classNames` customizes the card/front/back/exiting/scroll/viewport slots.

Opening on hover, focus or click is caller policy. Keep the stack open while the
pointer or keyboard focus moves between the trigger and its portaled content.
The Queue and controlled LongContent stories show both approaches. Always show
instructions for demo-only controls rather than expecting visitors to know them.

Set namespaced `--ui-card-stack-*` tokens for width, height limit, spacing,
appearance, layer and timing. Values live in the stylesheet. Host fonts and
colors follow the anchor through portals, and dark/light themes use the normal Nox palette.
