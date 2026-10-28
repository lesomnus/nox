# Form

`Form` presents always-editable fields using the same layout and typography as
`DescriptionList`. Its native controls use `EditableValue`'s padded hit area and
text alignment, with a persistent background from the dialog input palette.
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

`--ui-form-control-background`, `--ui-form-control-border` and
`--ui-form-control-radius` customize the control surface. The subtle inset border
is lighter than the input in dark themes and darker in light themes, without
changing control geometry. The shared field layout keeps label and value text aligned
when controls have larger padded hit areas.

See `Components/Form/Default` for the compact fields and `Components/Form/InCard`
for a dialog-style form with a pair of value menus and full-width text fields.
