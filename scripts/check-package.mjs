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
    import { FileChip, type FileChipProps, fileChipClassName, fileChipText } from "@lesomnus/nox";
    const fileChip: FileChipProps = {as:"a", href:"/report.md", children:"report.md", ref: node => { void node?.href; }};
    const attachmentChip: FileChipProps = {as:"button", loading:true, children:"Uploading", ref: node => { void node?.disabled; }};
    // @ts-expect-error Native disabled state belongs to the button variant.
    const invalidChip: FileChipProps = {as:"a", disabled:true, children:"Invalid"};
    void invalidChip; void fileChipClassName; void fileChipText("Report");
    import { Popover, type PopoverProps, type PopoverPlacement, type PopoverPosition } from "@lesomnus/nox";
    import { Progress, type ProgressProps } from "@lesomnus/nox";
    import { SectionLayout, SectionGroup, Section, type SectionLayoutProps, type SectionGroupProps, type SectionProps, type SectionButtonProps } from "@lesomnus/nox";
    const sections: SectionLayoutProps = {maxWidth: "40rem", align: "start", ref: node => {void node?.querySelector("section");}};
    const sectionGroup: SectionGroupProps = {ref: node => {void node?.children.length;}};
    const section: SectionProps = {"aria-label": "Record information", ref: node => {void node?.tagName;}};
    const sectionAction: SectionButtonProps = {as:"button", onClick: event => {void event.currentTarget.disabled;}, effect:"sparkle", ref: node => {void node?.focus();}};
    // @ts-expect-error Interactive props require the native button variant.
    const invalidSection: SectionProps = {disabled:true};
    void invalidSection;
    import { BorderTrailButton, type BorderTrailButtonProps, type BorderTrailSegment, type BorderTrailProgress, type BorderTrailSheen } from "@lesomnus/nox";
    const trail: BorderTrailSegment = { color: "#78d9ef", length: 0.12, duration: 13000, offset: 0.5 };
    const trailButton: BorderTrailButtonProps = { segments: [trail], active: true, colors: ["#c58bef"], segmentLength: 0.1, duration: 15000, ref: node => { void node?.focus(); } };
    const growingTrail: BorderTrailProgress = {value: 12, perSegment: 8, maxLength: 0.9};
    const trailSheen: BorderTrailSheen = {duration: 4000, length: 0.12, strength: 0.6, color: "#fff"};
    const popoverPosition: PopoverPosition = "top-start";
    const popoverPlacement: PopoverPlacement = "in-place";
    const popover: PopoverProps = { anchor: null, open: false, content: <span>Details</span>, placement: popoverPosition, onOpenChange: value => { void value; } };
    void Popover; void popover; void popoverPlacement;
    import { ThemeProvider, useTheme, createLocalStorageThemeStorage, type ThemeStorage, type ThemePreference } from "@lesomnus/nox";
    import { SlidingPages, SlidingPage, type SlidingPagesProps, type SlidingPageProps } from "@lesomnus/nox";

    import { Drawer, Card, CardActions, type CardProps, type DrawerProps, type DrawerSide } from "@lesomnus/nox";
    import { DatePicker, dateWindowSelection, dateWeekSelection, type DatePickerProps, type DatePickerDateInfo, type DatePickerRange, type DatePickerSelectionResolver } from "@lesomnus/nox";
    import { PinInput, type PinInputProps, SplitLayout, type SplitNode, setSplitRatio, PrefixValueMenu, type PrefixValueMenuProps, IconValueMenu, AuroraGlow, type AuroraGlowProps, type AuroraPalette, InkSparkle, type InkSparkleProps, Button, Checkbox, DateTime, DescriptionList, IdentifierValue, MenuSurface, type MenuSurfaceProps, MenuScrollArea, MenuItem, type MenuItemProps, MenuIcon, MenuGroupLabel, MenuDivider, NavigationPanel, StippleBackground, clusterMotion, workMotion, withPointerBurst, UIProvider } from "@lesomnus/nox";
    import { ScrollArea, type ScrollAreaProps } from "@lesomnus/nox";
    const outsideScroll: ScrollAreaProps = { children: <p>Outside rails</p>, scrollbarOffset: 12, horizontalScrollbar: true, scrollbarLabel: "Scroll document", horizontalScrollbarLabel: "Scroll columns" };
    import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption, TableScrollArea, type TableProps, type TableRowProps } from "@lesomnus/nox";
    import { LinkButton, Skeleton, SkeletonGroup, type LinkButtonProps, type SkeletonProps, type SkeletonGroupProps } from "@lesomnus/nox";
    import { ColorPicker, ColorPickerRoot, ColorPickerArea, ColorPickerHue, ColorPickerOpacity, type RgbColor, type ColorPickerProps, type ColorPickerRootProps, type ColorPickerAreaProps, type ColorPickerHueProps, type ColorPickerOpacityProps } from "@lesomnus/nox";
    import { Slider, SliderRoot, SliderControl, SliderValue, SliderTicks, SliderTick, type SliderProps, type SliderRootProps } from "@lesomnus/nox";
    import { DescriptionListRoot, DescriptionListRow, DescriptionListTerm, DescriptionListDetails, type DescriptionListRootProps, type DescriptionListRowProps } from "@lesomnus/nox";
    import { NavigationPanelRoot, NavigationPanelHeader, NavigationPanelTitle, NavigationPanelActions, NavigationPanelBody, NavigationPanelScrollBody, NavigationPanelFooter, type NavigationPanelRootProps } from "@lesomnus/nox";
    import { Calendar, CalendarRoot, CalendarHeader, CalendarMonth, CalendarPreviousMonth, CalendarNextMonth, CalendarGrid, CalendarDetails, CalendarStatus, CalendarFooter, CalendarToday, CalendarClear, CalendarDone, type CalendarProps, type CalendarRootProps, type CalendarDateInfo } from "@lesomnus/nox";
    import { TerminalWorkbench } from "@lesomnus/nox/terminal";
    import "@lesomnus/nox/styles.css";
    void TerminalWorkbench;
    const themeStorage: ThemeStorage = { read: async () => "system", write: async (preference: ThemePreference) => { void preference; }, subscribe: () => () => {} };
    void createLocalStorageThemeStorage("consumer.theme");
    function ThemeConsumer() { const { theme, preference, setPreference, ready, saving, error } = useTheme(); void setPreference; void ready; void saving; void error; return <span>{theme}/{preference}</span>; }
    const drawerSide: DrawerSide = "bottom";
    const slidingPage: SlidingPageProps = { value: "profile", "aria-label": "Profile", ref: node => { void node?.clientHeight; } };
    const slidingPages: SlidingPagesProps = { value: "profile", resize: "both", orientation: "horizontal", focusOnChange: true, children: <SlidingPage {...slidingPage} />, ref: node => { void node?.clientWidth; } };
    const drawer: DrawerProps = { open: false, onClose: () => {}, side: drawerSide, width: 360, height: "40%", align: "end", inset: 8, ref: node => { void node?.open; } };
    const card: CardProps = { title: "Details", fill: true, bodyPadding: 4, footer: <CardActions><Button>Close</Button></CardActions>, ref: node => { void node?.clientHeight; } };
    const table: TableProps = { "aria-label": "Records", stickyHeader: true, ref: node => { void node?.rows.length; } };
    const selectedRow: TableRowProps = { selected: true };
    const link: LinkButtonProps = { href: "#record", trailing: null, ref: node => { void node?.href; } };
    const skeleton: SkeletonProps = { variant: "circle", width: 32, animated: false, ref: node => { void node?.offsetWidth; } };
    const skeletonGroup: SkeletonGroupProps = { animated: false, sparkleOptions: { duration: 2000, seed: 7, color: [1, 1, 1, 0.1], origin: [-40, -40] }, ref: node => { void node?.clientWidth; } };
    const rgb: RgbColor = { r: 217, g: 255, b: 48 };
    const colorInput: ColorPickerProps = { label: "Accent", defaultValue: rgb, onChange: next => { void next.a; }, ref: node => { void node?.elements.length; } };
    const pickerRoot: ColorPickerRootProps = { label: "Custom color", defaultValue: rgb, name: "custom", style: { width: 240, display: "grid", gap: 12 }, ref: node => { void node?.elements.length; } };
    const pickerArea: ColorPickerAreaProps = { style: { height: 180 }, ref: node => { void node?.getBoundingClientRect(); }, onKeyDown: event => { if (event.key === "x") event.preventDefault(); } };
    const pickerHue: ColorPickerHueProps = { orientation: "vertical", ref: node => { void node?.valueAsNumber; } };
    const pickerOpacity: ColorPickerOpacityProps = { orientation: "horizontal", ref: node => { void node?.valueAsNumber; } };
    const slider: SliderProps = { label: "Gain", min: -10, max: 10, step: 0.5, defaultValue: 2.5, name: "gain", onChange: value => { void value.toFixed(1); } };
    const sliderRoot: SliderRootProps = { ...slider, ref: node => { void node?.elements.length; } };
    const listRoot: DescriptionListRootProps = { columns: 1, ref: node => { void node?.children.length; } };
    const listRow: DescriptionListRowProps = { ref: node => { void node?.clientWidth; } };
    const legacyRow: import("@lesomnus/nox").DescriptionListRow = { label: "Legacy row", value: 1 };
    void legacyRow;
    const panelRoot: NavigationPanelRootProps = { "aria-label": "Custom panel", style: { height: 160 }, ref: node => { void node?.clientHeight; } };
    const calendar: CalendarProps = { mode: "range", label: "Inline period", defaultValue: { start: "2026-10-21", end: null }, getSelectionDates: dateWeekSelection, onChange: value => { void value?.end; }, ref: node => { void node?.querySelector("button"); } };
    const calendarRoot: CalendarRootProps = { mode: "multiple", label: "Custom inline dates", defaultValue: [], getDateInfo: (): CalendarDateInfo => ({ label: "Available" }), onChange: dates => { void dates.join(","); } };
    // @ts-expect-error Calendar preserves the DatePicker selection discriminant.
    const invalidCalendar: CalendarProps = { mode: "range", label: "Invalid", value: [] };
    void invalidCalendar;
    const progress: ProgressProps = { value: 42, variant: "bordered", animated: false, sparkleOptions: { duration: 2000 } };
    const datePicker: DatePickerProps = { label: "Date", defaultValue: "2026-10-24", min: "2026-01-01", max: "2026-12-31", name: "date", locale: "en-US", weekStartsOn: 1, onChange: value => { void value; }, ref: node => { void node?.focus(); } };
    const holiday: DatePickerDateInfo = { disabled: true, label: "Holiday", description: "Closed", marker: "•", style: { color: "currentColor" } };
    const windowSelection: DatePickerSelectionResolver = dateWindowSelection({ before: 1, after: 1 });
    const multipleDates: DatePickerProps = { mode: "multiple", label: "Dates", defaultValue: [], getDateInfo: () => holiday, getSelectionDates: windowSelection, onChange: dates => { void dates.join(","); } };
    const interval: DatePickerRange = { start: "2026-10-21", end: null };
    const dateRange: DatePickerProps = { mode: "range", label: "Period", defaultValue: interval, getSelectionDates: dateWeekSelection, onChange: range => { void range?.end; } };
    // @ts-expect-error Selection modes require their matching value shapes.
    const invalidDateMode: DatePickerProps = { mode: "multiple", label: "Invalid", value: "2026-10-21" };
    void invalidDateMode;
    const pin: PinInputProps = { label: "Device code", groups: [4,4], mode: "alphanumeric", name: "device_code" };
    void MenuSurface;
    void MenuIcon;
    const menuSurface: MenuSurfaceProps = { anchor: null, role: "menu", style: { left: 0, top: 0 } };
    void menuSurface;
    const menuItem: MenuItemProps = { role: "menuitem", icon: <svg viewBox="0 0 24 24"><path d="M4 12h16" /></svg>, trailing: "Open", onClick: (event) => event.currentTarget.focus() };
    const splitTree: SplitNode = {kind:"split",id:"root",axis:"horizontal",ratio:0.5,first:{kind:"pane",id:"a"},second:{kind:"pane",id:"b"}};
    const prefixMenu: PrefixValueMenuProps = {label:"Effort",prefix:"Effort",prefixClassName:"prefix",value:"medium",options:[{value:"medium",label:"Medium"}],hideSelected:true,choose:() => {}};
    import { ValueMenu, type ValueMenuProps } from "@lesomnus/nox";
    const selectedMenu: ValueMenuProps = {label:"Aligned effort",value:"medium",options:[{value:"medium",label:"Medium"}],alignItemWithTrigger:true,choose:() => {}};
    const auroraPalette: AuroraPalette = ["#23b04a", "#2596e9", "#b14ccd"];
    const aurora: AuroraGlowProps = {active: true, paused: false, speed: 0.75, strength: 0.4, seed: 12, palette: auroraPalette};
    const sparkle: InkSparkleProps = { duration: 2000, origin: [-8, 40], centerMotion: "fixed", loop: true, sparkleColor: [0.25, 0.5, 0.75, 0.2] };
    createRoot(document.getElementById("root")!).render(
      <UIProvider>
        <FileChip {...fileChip} /><FileChip {...attachmentChip} />
        <div style={{position:"relative",height:40}}><AuroraGlow {...aurora} /></div>
        <div style={{height:100}}><SplitLayout node={splitTree} renderPane={id => id} junctionLabel="Resize both axes" onResize={(id,ratio) => {void setSplitRatio(splitTree,id,ratio);}} /><SplitLayout node={splitTree} renderPane={id => id} onChange={tree => {void tree;}} /></div>
        <PrefixValueMenu {...prefixMenu} />
        <ValueMenu {...selectedMenu} />
        <IconValueMenu label="Legacy effort" icon="Effort" value="medium" options={[{value:"medium",label:"Medium"}]} choose={() => {}} />
        <Button>Save</Button>
        <SectionLayout {...sections}><article><SectionGroup {...sectionGroup}><Section {...section}>Information</Section><Section>Activity</Section><Section {...sectionAction}>Run action</Section></SectionGroup></article></SectionLayout>
        <BorderTrailButton {...trailButton}>Work</BorderTrailButton>
        <BorderTrailButton progress={growingTrail} sheen={trailSheen}>Growing work</BorderTrailButton>
        <Progress {...progress} aria-label="Build progress" />
        <ThemeProvider storage={themeStorage} defaultPreference="system"><ThemeConsumer /></ThemeProvider>
        <SlidingPages {...slidingPages} />

        <Drawer {...drawer} aria-label="Details"><Card {...card}>Custom content</Card></Drawer>
        <DatePicker {...datePicker} />
        <DatePicker {...multipleDates} /><DatePicker {...dateRange} />
        <PinInput {...pin} />
        <ScrollArea {...outsideScroll} />
        <MenuScrollArea role="menu" aria-label="Custom actions" scrollbarLabel="Scroll actions">
          <MenuGroupLabel icon={<svg viewBox="0 0 24 24"><path d="M4 12h16" /></svg>}>Commands</MenuGroupLabel>
          <MenuItem {...menuItem}>Details</MenuItem>
          <MenuDivider />
        </MenuScrollArea>
        <Button effect="none">No ink</Button>
        <Button effect="sparkle" effectOptions={{color:[1,1,1,0.06],sparkleColor:[1,1,1,0.2],duration:1200,centerMotion:"fixed",seed:1}}>Custom ink</Button>
        <div style={{height:80}}><InkSparkle {...sparkle} /></div>
        <Checkbox aria-label="Select record" />
        <LinkButton {...link}>Record</LinkButton>
        <Slider {...slider} orientation="vertical" />
        <SliderRoot {...sliderRoot}><SliderValue /><SliderControl ref={node => { void node?.valueAsNumber; }} /><SliderTicks><SliderTick value={-10}>Low</SliderTick><SliderTick value={10}>High</SliderTick></SliderTicks></SliderRoot>
        <DescriptionListRoot {...listRoot}><DescriptionListRow {...listRow}><DescriptionListTerm>Name</DescriptionListTerm><DescriptionListDetails>Example</DescriptionListDetails><DescriptionListDetails>Second value</DescriptionListDetails></DescriptionListRow></DescriptionListRoot>
        <NavigationPanelRoot {...panelRoot}><NavigationPanelHeader><NavigationPanelTitle>Panel</NavigationPanelTitle><NavigationPanelActions><Button>Add</Button></NavigationPanelActions></NavigationPanelHeader><NavigationPanelBody>Body</NavigationPanelBody><NavigationPanelScrollBody>Scrolling body</NavigationPanelScrollBody><NavigationPanelFooter>Footer</NavigationPanelFooter></NavigationPanelRoot>
        <Calendar {...calendar} />
        <CalendarRoot {...calendarRoot}><CalendarHeader><CalendarMonth /><CalendarPreviousMonth /><CalendarNextMonth /></CalendarHeader><CalendarGrid /><CalendarDetails /><CalendarStatus /><CalendarFooter><CalendarToday /><CalendarClear /><CalendarDone /></CalendarFooter></CalendarRoot>
        <ColorPicker {...colorInput} />
        <ColorPickerRoot {...pickerRoot}>
          <div><ColorPickerHue {...pickerHue} /></div>
          <ColorPickerArea {...pickerArea} />
          <ColorPickerOpacity {...pickerOpacity} />
        </ColorPickerRoot>
        <SkeletonGroup {...skeletonGroup}><Skeleton {...skeleton} /><Skeleton width="60%" /></SkeletonGroup>
        <TableScrollArea style={{height:120}} scrollbarLabel="Scroll records" horizontalScrollbarLabel="Scroll record columns">
          <Table {...table}>
            <TableCaption>Records</TableCaption>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead align="right">Count</TableHead></TableRow></TableHeader>
            <TableBody><TableRow {...selectedRow}><TableHead scope="row">Example</TableHead><TableCell align="right">1</TableCell></TableRow></TableBody>
            <TableFooter><TableRow><TableCell colSpan={2}>Total: 1</TableCell></TableRow></TableFooter>
          </Table>
        </TableScrollArea>
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
