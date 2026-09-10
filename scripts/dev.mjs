import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [
  spawn(npmCommand, ["run", "start"], { stdio: "inherit" }),
  spawn(npmCommand, ["run", "start:iframe"], { stdio: "inherit" })
];

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 100).unref();
}

for (const child of children) {
  child.on("exit", code => {
    if (!stopping && code && code !== 0) stop(code);
  });
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

console.log("\nHost:   http://127.0.0.1:4200/");
console.log("iframe: http://127.0.0.1:4300/iframe\n");
