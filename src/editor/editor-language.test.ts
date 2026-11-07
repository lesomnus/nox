import { describe, expect, it } from "vitest";
import { detectEditorLanguage } from "./editor-language";

const languages = [
  { id: "plaintext", extensions: [".txt"] },
  { id: "python", extensions: [".py"], firstLine: "^#!.*\\bpython[0-9.-]*\\b" },
  { id: "yaml", extensions: [".yml", ".yaml"] },
  { id: "rust", extensions: [".rs"] },
  { id: "dockerfile", extensions: [".dockerfile"], filenames: ["Dockerfile"] },
  { id: "proto", extensions: [".proto"] },
  { id: "typescript", extensions: [".ts"] },
  { id: "template", extensions: [".template.ts"] },
];
describe("editor language detection", () => {
  it("uses registered extensions, names and case independently of the old short map", () => {
    for (const [path, expected] of [
      ["/workspace/run.py", "python"],
      ["config.YAML", "yaml"],
      ["lib.rs", "rust"],
      ["C:\\workspace\\Dockerfile", "dockerfile"],
      ["api.proto", "proto"],
      ["view.template.ts", "template"],
    ])
      expect(detectEditorLanguage(path, "", languages)).toBe(expected);
  });
  it("uses a shebang for extensionless files and preserves explicit text filenames", () => {
    expect(
      detectEditorLanguage(
        "run",
        "#!/usr/bin/env python3\nprint('hello')",
        languages,
      ),
    ).toBe("python");
    expect(
      detectEditorLanguage("note.txt", "#!/usr/bin/python3", languages),
    ).toBe("plaintext");
    expect(detectEditorLanguage("notes", "ordinary notes", languages)).toBe(
      "plaintext",
    );
  });
});
