import { watch } from "node:fs";
import { spawn } from "node:child_process";

let running;
let pending = false;
let timer;
let stopping = false;
function build() {
  if (running) {
    pending = true;
    return;
  }
  pending = false;
  running = spawn(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "build"],
    {
      stdio: "inherit",
    },
  );
  running.on("error", (error) => console.error(error));
  running.on("exit", (code) => {
    running = undefined;
    if (stopping) return;
    if (code) console.error("Build failed; watching for the next edit.");
    if (pending) build();
  });
}
const watcher = watch(
  new URL("../src/", import.meta.url),
  { recursive: true },
  () => {
    clearTimeout(timer);
    timer = setTimeout(build, 150);
  },
);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopping = true;
    clearTimeout(timer);
    watcher.close();
    if (running) running.kill(signal);
  });
}
build();
