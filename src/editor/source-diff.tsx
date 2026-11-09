import { useEffect, useRef, useState } from "react";
import type * as Monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import { monospaceFont } from "../theme/fonts";
import { defaultEditorSettings, type EditorSettings } from "./settings";
import { loadEditor } from "./load-editor";
import editorStyles from "./source-editor.module.css";
import styles from "./source-diff.module.css";

/** Read-only, virtualized source comparison with changed word ranges emphasized. */
export function SourceDiff({
  original,
  modified,
  path,
  ariaLabel,
  languageId,
  settings: configuration,
  theme = "dark",
  sideBySide = false,
}: {
  original: string;
  modified: string;
  path: string;
  ariaLabel: string;
  languageId?: string;
  settings?: Partial<EditorSettings>;
  theme?: "light" | "dark";
  sideBySide?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const sync = useRef<(() => void) | undefined>(undefined);
  const settings = {
    ...defaultEditorSettings,
    fontFamily: monospaceFont(),
    ...configuration,
    wordWrap: configuration?.wordWrap ?? true,
  };
  const latest = useRef({
    original,
    modified,
    path,
    ariaLabel,
    languageId,
    settings,
    theme,
    sideBySide,
  });
  latest.current = {
    original,
    modified,
    path,
    ariaLabel,
    languageId,
    settings,
    theme,
    sideBySide,
  };
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    sync.current?.();
  }, [
    original,
    modified,
    languageId,
    theme,
    sideBySide,
    settings.fontFamily,
    settings.colorPalette,
    settings.indentSize,
    settings.insertSpaces,
    settings.tabSize,
    settings.wordWrap,
    settings.showControlCharacters,
  ]);
  useEffect(() => {
    let canceled = false;
    let editor: Monaco.editor.IStandaloneDiffEditor | undefined;
    let before: Monaco.editor.ITextModel | undefined;
    let after: Monaco.editor.ITextModel | undefined;
    let changed: Monaco.IDisposable | undefined;
    setBusy(true);
    setError("");
    loadEditor()
      .then(({ monaco, configureEditor, editorOptions, language }) => {
        if (canceled) return;
        const initial = latest.current;
        const syntax = initial.languageId ?? language(path, initial.modified);
        before = monaco.editor.createModel(initial.original, syntax);
        after = monaco.editor.createModel(initial.modified, syntax);
        editor = monaco.editor.createDiffEditor(host.current!, {
          ...editorOptions,
          theme: `nox-${initial.settings.colorPalette}-${initial.theme}`,
          readOnly: true,
          domReadOnly: true,
          originalEditable: false,
          renderSideBySide: initial.sideBySide,
          renderIndicators: true,
          renderMarginRevertIcon: false,
          renderGutterMenu: false,
          renderOverviewRuler: false,
          ignoreTrimWhitespace: false,
          unicodeHighlight: {
            ambiguousCharacters: false,
            invisibleCharacters: false,
            nonBasicASCII: false,
          },
          diffAlgorithm: "advanced",
          experimental: { useTrueInlineView: true },
          diffWordWrap: initial.settings.wordWrap ? "on" : "off",
          originalAriaLabel: `${initial.ariaLabel}: before`,
          modifiedAriaLabel: `${initial.ariaLabel}: after`,
          hideUnchangedRegions: {
            enabled: true,
            contextLineCount: 3,
            minimumLineCount: 6,
          },
        });
        changed = editor.onDidUpdateDiff(() => {
          if (canceled) return;
          setBusy(false);
          const first = editor!.getLineChanges()?.[0];
          if (first) {
            const word = first.charChanges?.[0];
            editor!.getModifiedEditor().revealPositionInCenter(
              {
                lineNumber: Math.max(
                  1,
                  word?.modifiedStartLineNumber ??
                    first.modifiedStartLineNumber,
                ),
                column: Math.max(1, word?.modifiedStartColumn ?? 1),
              },
              monaco.editor.ScrollType.Immediate,
            );
          }
        });
        sync.current = () => {
          const next = latest.current;
          if (
            before!.getValue() !== next.original ||
            after!.getValue() !== next.modified
          )
            setBusy(true);
          if (before!.getValue() !== next.original)
            before!.setValue(next.original);
          if (after!.getValue() !== next.modified)
            after!.setValue(next.modified);
          const syntax = next.languageId ?? language(path, next.modified);
          for (const model of [before!, after!])
            if (model.getLanguageId() !== syntax)
              monaco.editor.setModelLanguage(model, syntax);
          configureEditor(
            editor!.getOriginalEditor(),
            before!,
            next.settings,
            next.theme,
          );
          monaco.editor.setTheme(
            `nox-${next.settings.colorPalette}-${next.theme}`,
          );
          configureEditor(
            editor!.getModifiedEditor(),
            after!,
            next.settings,
            next.theme,
          );
          editor!.updateOptions({
            renderSideBySide: next.sideBySide,
            diffWordWrap: next.settings.wordWrap ? "on" : "off",
          });
        };
        sync.current();
        editor.setModel({ original: before, modified: after });
      })
      .catch((reason) => {
        if (!canceled) {
          setError(String(reason));
          setBusy(false);
        }
      });
    return () => {
      canceled = true;
      sync.current = undefined;
      changed?.dispose();
      editor?.setModel(null);
      editor?.dispose();
      before?.dispose();
      after?.dispose();
    };
  }, [path]);
  return (
    <div
      className={`${editorStyles.root} ${styles.root} source-diff code-editor`}
      role="region"
      aria-label={ariaLabel}
      aria-busy={busy}
    >
      <div ref={host} className={styles.host} />
      {error ? (
        <p role="alert" className={styles.status}>
          {error}
        </p>
      ) : (
        busy && (
          <p role="status" className={styles.status}>
            Loading comparison…
          </p>
        )
      )}
    </div>
  );
}
