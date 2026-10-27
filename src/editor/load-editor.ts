type EditorModule = typeof import("./code-editor");

const recover = import.meta.glob<EditorModule>("./code-editor.ts", {
  query: "?nox-editor-retry",
})["./code-editor.ts"]!;

export async function loadEditor(): Promise<EditorModule> {
  try {
    return await import("./code-editor");
  } catch (error) {
    if (
      !(error instanceof TypeError) ||
      !/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
        error.message,
      )
    )
      throw error;
    // Browsers cache failed module URLs. A separate, statically bundled entry
    // retries a transient load without reloading the page or losing editor state.
    await new Promise((resolve) => setTimeout(resolve, 150));
    return recover();
  }
}
