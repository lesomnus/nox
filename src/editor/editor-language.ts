export type EditorLanguageDefinition = {
  id: string;
  extensions?: readonly string[];
  filenames?: readonly string[];
  firstLine?: string;
};

/** Use the tokenizer registry's filenames, longest extension and shebang metadata. */
export function detectEditorLanguage(
  path: string,
  text: string,
  languages: readonly EditorLanguageDefinition[],
) {
  const name = path.replaceAll("\\", "/").split("/").at(-1)!.toLowerCase();
  const named = languages.find((language) =>
    language.filenames?.some((file) => file.toLowerCase() === name),
  );
  if (named) return named.id;
  let match = "plaintext",
    length = 0;
  for (const language of languages)
    for (const extension of language.extensions ?? [])
      if (extension.length > length && name.endsWith(extension.toLowerCase())) {
        match = language.id;
        length = extension.length;
      }
  if (length) return match;
  const firstLine = text.slice(0, 1024).split(/\r?\n/, 1)[0];
  return (
    languages.find(
      (language) =>
        language.firstLine && new RegExp(language.firstLine).test(firstLine),
    )?.id ?? "plaintext"
  );
}
