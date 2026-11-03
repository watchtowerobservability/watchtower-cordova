// Typecheck and tests resolve the browser SDK from ../browser/src (tsconfig paths, vitest alias).
// In the monorepo that is the sibling sdks/browser; in the public mirror, fetch the browser mirror there.
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const dest = fileURLToPath(new URL("../../browser", import.meta.url));
if (!existsSync(`${dest}/src`)) {
  execFileSync("git", ["clone", "--depth", "1", "https://github.com/watchtowerobservability/watchtower-browser.git", dest], { stdio: "inherit" });
}
// the browser sources import its OpenTelemetry deps, so they must resolve from ../browser/node_modules
if (!existsSync(`${dest}/node_modules`)) {
  execFileSync("pnpm", ["install", "--frozen-lockfile", "--ignore-scripts"], { cwd: dest, stdio: "inherit" });
}
