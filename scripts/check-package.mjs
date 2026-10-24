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
    import { PinInput, type PinInputProps, SplitLayout, type SplitNode, setSplitRatio, PrefixValueMenu, type PrefixValueMenuProps, IconValueMenu, AuroraGlow, type AuroraGlowProps, type AuroraPalette, InkSparkle, type InkSparkleProps, Button, Checkbox, DateTime, DescriptionList, IdentifierValue, MenuSurface, type MenuSurfaceProps, MenuScrollArea, MenuItem, type MenuItemProps, MenuIcon, MenuGroupLabel, MenuDivider, NavigationPanel, StippleBackground, clusterMotion, workMotion, withPointerBurst, UIProvider } from "@lesomnus/nox";
    import { TerminalWorkbench } from "@lesomnus/nox/terminal";
    import "@lesomnus/nox/styles.css";
    void TerminalWorkbench;
    const pin: PinInputProps = { label: "Device code", groups: [4,4], mode: "alphanumeric", name: "device_code" };
    void MenuSurface;
    void MenuIcon;
    const menuSurface: MenuSurfaceProps = { anchor: null, role: "menu", style: { left: 0, top: 0 } };
    void menuSurface;
    const menuItem: MenuItemProps = { role: "menuitem", icon: <svg viewBox="0 0 24 24"><path d="M4 12h16" /></svg>, trailing: "Open", onClick: (event) => event.currentTarget.focus() };
    const splitTree: SplitNode = {kind:"split",id:"root",axis:"horizontal",ratio:0.5,first:{kind:"pane",id:"a"},second:{kind:"pane",id:"b"}};
    const prefixMenu: PrefixValueMenuProps = {label:"Effort",prefix:"Effort",prefixClassName:"prefix",value:"medium",options:[{value:"medium",label:"Medium"}],choose:() => {}};
    const auroraPalette: AuroraPalette = ["#23b04a", "#2596e9", "#b14ccd"];
    const aurora: AuroraGlowProps = {active: true, paused: false, speed: 0.75, strength: 0.4, seed: 12, palette: auroraPalette};
    const sparkle: InkSparkleProps = { duration: 2000, origin: [-8, 40], centerMotion: "fixed", loop: true, sparkleColor: [0.25, 0.5, 0.75, 0.2] };
    createRoot(document.getElementById("root")!).render(
      <UIProvider>
        <div style={{position:"relative",height:40}}><AuroraGlow {...aurora} /></div>
        <div style={{height:100}}><SplitLayout node={splitTree} renderPane={id => id} junctionLabel="Resize both axes" onResize={(id,ratio) => {void setSplitRatio(splitTree,id,ratio);}} /><SplitLayout node={splitTree} renderPane={id => id} onChange={tree => {void tree;}} /></div>
        <PrefixValueMenu {...prefixMenu} />
        <IconValueMenu label="Legacy effort" icon="Effort" value="medium" options={[{value:"medium",label:"Medium"}]} choose={() => {}} />
        <Button>Save</Button>
        <PinInput {...pin} />
        <MenuScrollArea role="menu" aria-label="Custom actions" scrollbarLabel="Scroll actions">
          <MenuGroupLabel icon={<svg viewBox="0 0 24 24"><path d="M4 12h16" /></svg>}>Commands</MenuGroupLabel>
          <MenuItem {...menuItem}>Details</MenuItem>
          <MenuDivider />
        </MenuScrollArea>
        <Button effect="none">No ink</Button>
        <Button effect="sparkle" effectOptions={{color:[1,1,1,0.06],sparkleColor:[1,1,1,0.2],duration:1200,centerMotion:"fixed",seed:1}}>Custom ink</Button>
        <div style={{height:80}}><InkSparkle {...sparkle} /></div>
        <Checkbox aria-label="Select record" />
        <StippleBackground paused pattern="diamond" colorBlend="dither" palette={["#abc", "#123456", "#fedcba", "#84a59d"]} motion={(t, {aspect}) => [{x: 0.5, y: 0.5, radius: 0.2 + Math.sin(t) * 0.02, scale: [aspect, 1], rotation: t}]} style={{height: 100}} />
        <StippleBackground motion={clusterMotion} edgeFade={0.75} edgeFadeSteps={3} seed={7} paused style={{height: 100}} />
        <StippleBackground motion={workMotion} active={false} style={{height: 100}} />
        <StippleBackground pointerEffects={false} motion={withPointerBurst((t, {pointer}) => [{x:pointer?.x ?? 0.5,y:0.5,radius:0.1 + Math.sin(t)*0.01}], {maxParticles:8})} style={{height:100}} />
        <StippleBackground paused motion={() => [{x:0.5, y:0.5, radius:0.2, deformation:0.8}]} style={{height:100}} />
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
