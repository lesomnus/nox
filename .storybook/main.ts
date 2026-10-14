import type { StorybookConfig } from "@storybook/react-vite";
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs"],
  framework: "@storybook/react-vite",
  core: { disableTelemetry: true },
  async viteFinal(config) {
    const { mergeConfig, defaultClientConditions } = await import("vite");
    return mergeConfig(config, {
      resolve: {
        conditions: ["nox-source", ...defaultClientConditions],
        dedupe: ["react", "react-dom", "monaco-editor"],
      },
      optimizeDeps: { exclude: ["@lesomnus/nox"] },
    });
  },
};
export default config;
