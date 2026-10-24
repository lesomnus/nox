# Component composition review

Reviewed 2026-10-24. The four strongest candidates below have now been
implemented, alongside ColorPicker. Their public APIs and usage examples are
in the [composition guide](component-composition.md). Conditional candidates
remain review findings, not implemented commitments. Calendar was extracted
from the completed DatePicker multiple/range/metadata implementation.

The useful boundary is an element that consumers need to arrange, omit or
replace while retaining shared behavior. Exporting every decorative span would
increase the public API without adding meaningful composition.

## Extracted components

| Component                                                                  | Extracted boundary                                                                                                                                | Consumer benefit                                                                                      | Behavior that must remain shared                                                                                                                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [DatePicker](../src/components/date-picker/date-picker.tsx)                | Standalone `Calendar` and Root/Header/Month/navigation/Grid/Details/Status/Footer/action parts; DatePicker composes a trigger and popup around it | Inline calendar in a page/dialog, custom month navigation without a forced trigger/popup              | Selection model, min/max and disabled dates, locale, date metadata, focus and keyboard navigation. The completed multiple/range behavior is retained by both Calendar and DatePicker.   |
| [SettingSlider](../src/components/setting-slider/setting-slider.tsx)       | General native `Slider` plus optional Value/Ticks; keep SettingSlider as the inherited-setting preset                                             | Reuse the range UI for opacity, volume or arbitrary numeric ranges; move or omit ticks/output         | Generic slider owns min/max/step/value and native accessibility. SettingSlider alone owns the current 0=inherited and 1–8 semantics. ColorPicker rails still own their color gradients. |
| [DescriptionList](../src/components/description-list/description-list.tsx) | Root, Row, Term and Details; preserve `rows` as a convenience renderer                                                                            | Multiple values for one term, caller-owned labels, conditionally inserted rows and custom row layouts | Native dl/dt/dd semantics and layout styles. Preserve dt/dd adjacency used by EditableValue; avoid hard-wiring FieldLabel into every term.                                              |
| [NavigationPanel](../src/components/navigation-panel/navigation-panel.tsx) | Root, Header, Title, Actions, Body and optional Footer                                                                                            | Search/filter below title, pinned footer, alternate header layout or body without forced scrolling    | Accessible panel labeling and optional ScrollArea composition. Title registration must preserve labels when header children are reordered.                                              |

Implemented APIs: SliderRoot/Control/Value/Ticks/Tick; DescriptionListRoot/Row/
Term/Details; NavigationPanelRoot/Header/Title/Actions/Body/ScrollBody/Footer;
CalendarRoot/Header/Month/PreviousMonth/NextMonth/Grid/Details/Status/Footer/
Today/Clear/Done. Original default components compose the same parts.

## Candidates requiring a concrete use case

| Component                                                                                                                            | Possible boundary                                                                                       | Tradeoff / current escape hatch                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ActionMenu](../src/components/action-menu/action-menu.tsx), [ValueMenu](../src/components/value-menu/value-menu.tsx)                | Behavioral Root/Trigger/Content plus menu items; ValueMenu may expose Search and selected-value display | Useful for replacing a trigger or inserting controls. Rendering pieces (`MenuSurface`, `MenuItem`, `MenuGroupLabel`, `MenuDivider`, `MenuScrollArea`) are already public. The missing extraction is open/focus/selection behavior, not more styled rows. Preserve portal focus, keyboard navigation, anchoring and search semantics together. `triggerContent` and option icons/groups cover many existing needs. |
| [EditableValue](../src/components/editable-value/editable-value.tsx)                                                                 | Root, Trigger, Editor, Input, Actions, Error                                                            | Useful for multiline/select editors or custom save buttons. Must preserve draft/save/error lifecycle, validation, pending dismissal protection, focus return and anchored label animation. Prefer a concrete second editor before freezing a broad public contract.                                                                                                                                               |
| [PinInput](../src/components/pin-input/pin-input.tsx)                                                                                | Native-input Root plus Group/Slot/Separator or a slot render callback                                   | Custom grouping and per-slot decorations can benefit. It currently uses ONE native input over decorative slots, with caret mapping based on slot geometry. Keep the single input for IME/autofill/paste; arbitrary slot rearrangement requires explicit index registration. Existing `groups`, `separator` and `masked` already cover basic layouts.                                                              |
| [SettingField](../src/components/setting-field/setting-field.tsx), [FloatingCard](../src/components/floating-card/floating-card.tsx) | Header/label, body/control, details/footer parts                                                        | Both already accept children and optional supplementary content. Extract if a second layout needs the same visual treatment; keep setting label associations and card semantics, and consider shared visual pieces before adding another unrelated header/footer family.                                                                                                                                          |

## Already composable or low benefit

- Dialog exports Header/Title/Description/Body/Footer; Table exports its native
  structure and optional ScrollArea wrapper. They already support rearranging
  their meaningful regions.
- ColorPicker now exports Root/Area/Hue/Opacity. The default ColorPicker is a
  composition of these parts rather than a separate implementation.
- Skeleton and SkeletonGroup already separate placeholder shape from the
  shared InkSparkle surface. The internal registry/mask is an implementation
  detail and does not need public elements.
- ScrollArea already offers viewport/content refs and per-slot classes. Splitting
  rail/thumb/fade rendering would need a concrete custom scrollbar use case
  because measurements and pointer geometry depend on their relationship.
- IdentifierValue already composes public CopyButton and OverflowHint.
  Splitting its short text span adds little beyond composing those components.
- DateTime/ElapsedTime already reuse public AnimatedText. Their punctuation and
  padding are formatting details; tokens and motion options cover customization.
- Button exposes ButtonContent and children; LinkButton has an optional trailing
  element. Checkbox/Radio/Switch, Progress, SegmentedControl and visual effects
  do not currently have enough independently placed UI to justify a parts API.
  For richer segment content, an option render callback is a smaller first step
  than a complete Root/Item/Indicator system.
