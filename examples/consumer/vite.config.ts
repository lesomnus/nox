import { fileURLToPath } from "node:url";
import { defineConfig, defaultClientConditions } from "vite";

export default defineConfig(({ mode }) => ({
  root: fileURLToPath(new URL("./", import.meta.url)),
  resolve: {
    conditions: [
      ...(mode === "source" ? ["nox-source"] : []),
      ...defaultClientConditions,
    ],
    dedupe: ["react", "react-dom", "monaco-editor"],
  },
  optimizeDeps: { exclude: ["@lesomnus/nox"] },
  build: { outDir: `../../dist/example-${mode}`, emptyOutDir: true },
}));
