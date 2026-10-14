import { defineConfig } from "vitest/config";
import { defaultClientConditions } from "vite";

export default defineConfig({
  resolve: {
    conditions: ["nox-source", ...defaultClientConditions],
    dedupe: ["react", "react-dom"],
  },
  test: { include: ["src/**/*.test.ts", "src/**/*.test.tsx"] },
});
