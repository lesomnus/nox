# Form

`Form` presents always-editable fields using the same layout and typography as
`DescriptionList`. Its control surfaces follow the cxz session/account creation
forms: 12px padding, 10px radius, shade-17 background and no visible resting border.
Keyboard focus has a 2px outline with a 2px offset.
Layout styles are shared with `DescriptionList`; they are not separate copies.
Design values live in the CSS and theme tokens.

```tsx
<Form onSubmit={save}>
  <FormField label="Name" htmlFor="name">
    <input id="name" name="name" required />
  </FormField>
  <FormField label="Status">
    <ValueMenu
      label="Status"
      alignItemWithTrigger
      value={status}
      options={options}
      choose={setStatus}
    />
  </FormField>
  <FormField label="Description" htmlFor="description" fullWidth>
    <textarea id="description" name="description" />
  </FormField>
</Form>
```

`columns` selects a single or double column layout. `FormField.fullWidth` spans
the available columns. Use `htmlFor` with the native control's `id`; composed
controls such as `ValueMenu` retain their own accessible label.

Use `as="fieldset"` to group fields inside an existing form, including a native
`disabled` group. Native form attributes, event handlers and refs are forwarded.
Submission, validation, values, network requests and error messages belong to
the caller. No form state or schema library is required.

`--ui-form-control-background`, `--ui-form-control-border`,
`--ui-form-control-radius`, `--ui-form-control-padding-block` and
`--ui-form-control-padding-inline` customize the surface. The border token defaults
to transparent; setting a color adds an inset stroke without changing geometry.

FormField's label stays one radius inside the control's left edge, at the end of
the rounded corner, even when the radius is customized. Input text padding is
independent of that alignment. Controls extend across this label inset while
staying within their column; vertical spacing leaves the label clear of the input.
ValueMenu uses the same height and text inset as native inputs. DescriptionList
and EditableValue retain their existing compact layout.

See `Components/Form/Default` for the fields and `Components/Form/InCard`
for a dialog-style form with a pair of value menus and full-width text fields.
