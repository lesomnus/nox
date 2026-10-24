# SlidingPages

A clipped viewport for changing steps without replacing the surrounding view.
Compose direct, uniquely named SlidingPage children and control `value` from
your own buttons, validation or router. Their order determines the slide
direction. A jump skips intermediate pages rather than showing their contents.

```tsx
import { useState } from "react";
import { Button, SlidingPages, SlidingPage } from "@lesomnus/nox";
import "@lesomnus/nox/styles.css";

function Setup() {
  const [step, setStep] = useState("profile");
  return (
    <SlidingPages value={step} resize="height" aria-label="Setup">
      <SlidingPage value="profile" aria-label="Profile">
        <label>
          Name <input name="name" />
        </label>
        <Button onClick={() => setStep("review")}>Next</Button>
      </SlidingPage>
      <SlidingPage value="review" aria-label="Review">
        <p>Review the form before submitting.</p>
        <Button onClick={() => setStep("profile")}>Back</Button>
      </SlidingPage>
    </SlidingPages>
  );
}
```

## Viewport sizing

- `resize="none"`: supply the viewport height with CSS or style. Width and
  height remain fixed during navigation. Put long page content in ScrollArea.
- `resize="height"` (default): fill the available width and animate height to
  match the active page. Do not set a fixed viewport height in this mode.
- `resize="both"`: animate width and height to the active page. Give individual
  pages a width with style/className, or let their content determine it. The
  available parent width caps pages, including after a container/window resize.
  Use a parent with an independently determined width, rather than a shrink-to-fit
  parent whose width depends on the animated viewport.

Content resizing, text wrapping, loaded images and validation messages are
measured with ResizeObserver. Put page spacing on SlidingPage rather than on
the viewport. SlidingPages supplies no card, background, radius or navigation;
compose those with the host's existing surface. Its ref points to the viewport;
a SlidingPage ref points to that page's div.

Both size and position use the same duration/easing. Override
`--ui-sliding-pages-duration` and `--ui-sliding-pages-easing` in the host's CSS.
Their defaults live in src/theme/tokens.css. Initial mounting does not slide,
rapid navigation retargets the existing transitions, and reduced-motion removes
both sliding and size animation. No timers or animation library are needed.

## Forms, state and accessibility

Pages stay mounted with stable value keys, preserving uncontrolled inputs,
component state and each page's own scroll position. Inactive pages are inert,
aria-hidden and eventually visually hidden once they have left the viewport.
They remain in the DOM and their fields remain in FormData. This is intended
for a small set of form steps, rather than virtualizing a long list of pages.

Inactive controls still participate in native form validation. The host should
validate the current step before changing value, and validate all answers before
submission. The Multi Step Form story uses one form with explicit step
validation, so hidden required fields do not block the first Next action.
SlidingPages never submits, disables fields, changes values or owns validation.
Business state, async pending states and error messages belong to the host.

When focus was inside the outgoing page, it moves to the new page's div, or its
`initialFocus` ref when supplied. This only happens on navigation, never on the
first mount. Navigation outside the viewport retains focus. Set
`focusOnChange={false}` to manage focus yourself. Inactive pages cannot receive
keyboard focus. Give pages headings or descriptive aria-labels; there are no
implicit carousel/tab roles, live announcements or arrow-key handlers that
would conflict with form editing.

`orientation="vertical"` slides up/down. Horizontal slides follow inherited
LTR/RTL direction. The order of children establishes forward/back; changing a
value to one not present shows no active page. Keep values unique and stable
when reordering children. Conditional rendering removes that page's state;
keeping the page mounted is how drafts survive navigation.

Storybook **Components/SlidingPages** includes Fixed Viewport, Auto Height,
Auto Size, Vertical, Right To Left, Multi Step Form and Strict Lifecycle.
