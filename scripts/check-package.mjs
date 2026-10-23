import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const temporary = await mkdtemp(join(tmpdir(), "nox-package-"));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
function run(command, args, cwd = temporary) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}

try {
  const [archive] = JSON.parse(
    run(
      npm,
      ["pack", "--ignore-scripts", "--json", "--pack-destination", temporary],
      root,
    ),
  );
  assert(archive.files.some(({ path }) => path === "dist/index.d.ts"));
  assert(archive.files.some(({ path }) => path === "dist/style.css"));
  assert(archive.files.some(({ path }) => path === "src/index.ts"));
  await writeFile(
    join(temporary, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: {
        [pkg.name]: `file:${join(temporary, archive.filename)}`,
        ...Object.fromEntries(
          [
            "react",
            "react-dom",
            "@types/react",
            "@types/react-dom",
            "typescript",
            "vite",
          ].map((name) => [name, pkg.devDependencies[name]]),
        ),
      },
    }),
  );
  run(npm, ["install", "--ignore-scripts", "--no-audit", "--no-fund"]);
  // The core and terminal entries must be usable without optional Monaco.
  const installed = JSON.parse(
    await readFile(
      join(temporary, "node_modules", pkg.name, "package.json"),
      "utf8",
    ),
  );
  assert.equal(installed.name, "@lesomnus/nox");
  const nodeModules = await import("node:fs/promises");
  await assert.rejects(
    nodeModules.access(join(temporary, "node_modules/monaco-editor")),
  );
  await writeFile(
    join(temporary, "index.html"),
    '<div id="root"></div><script type="module" src="/main.tsx"></script>',
  );
  await writeFile(
    join(temporary, "main.tsx"),
    `
    import { createRoot } from "react-dom/client";
    import { Button, Checkbox, DateTime, DescriptionList, IdentifierValue, NavigationPanel, StippleBackground, UIProvider } from "@lesomnus/nox";
    import { TerminalWorkbench } from "@lesomnus/nox/terminal";
    import "@lesomnus/nox/styles.css";
    void TerminalWorkbench;
    createRoot(document.getElementById("root")!).render(
      <UIProvider>
        <Button>Save</Button>
        <Checkbox aria-label="Select record" />
        <StippleBackground paused pattern="diamond" colors={["#abc", "#123456", "#fedcba"]} style={{height: 100}} />
        <NavigationPanel title="Records">
          <DescriptionList rows={[
            { label: "ID", value: <IdentifierValue value="1a2b3c4d-5e6f-7788-9900-aabbccddeeff" /> },
            { label: "Created", value: <DateTime value="2026-10-20T02:38:19Z" /> },
          ]} />
        </NavigationPanel>
      </UIProvider>
    );
  `,
  );
  const compilerOptions = {
    target: "ES2022",
    module: "ESNext",
    moduleResolution: "Bundler",
    jsx: "react-jsx",
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: ["vite/client"],
  };
  for (const mode of ["dist", "source"]) {
    const customConditions = mode === "source" ? ["nox-source"] : [];
    await writeFile(
      join(temporary, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { ...compilerOptions, customConditions },
        include: ["main.tsx"],
      }),
    );
    run(process.execPath, ["node_modules/typescript/bin/tsc", "--noEmit"]);
    const entry = run(process.execPath, [
      ...(mode === "source" ? ["--conditions=nox-source"] : []),
      "--input-type=module",
      "-e",
      'console.log(import.meta.resolve("@lesomnus/nox"))',
    ]).trim();
    assert(
      entry.endsWith(mode === "source" ? "/src/index.ts" : "/dist/index.js"),
    );
    await writeFile(
      join(temporary, "vite.config.mjs"),
      `
      import { defineConfig, defaultClientConditions } from "vite";
      export default defineConfig({ resolve: { conditions: [...${JSON.stringify(customConditions)}, ...defaultClientConditions], dedupe: ["react", "react-dom"] } });
    `,
    );
    run(process.execPath, ["node_modules/vite/bin/vite.js", "build"]);
    console.log(`PASS packed ${mode}: resolution, types and consumer build`);
  }
  await writeFile(
    join(temporary, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        ...compilerOptions,
        module: "NodeNext",
        moduleResolution: "NodeNext",
      },
      include: ["main.tsx"],
    }),
  );
  run(process.execPath, ["node_modules/typescript/bin/tsc", "--noEmit"]);
  console.log("PASS packed dist: NodeNext types; Monaco remains optional");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
