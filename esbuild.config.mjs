import { build } from "esbuild";

// The app bundles this with its own tooling; the browser SDK stays a peer import.
await build({ entryPoints: ["src/index.ts"], bundle: true, target: "es2020", sourcemap: true, format: "esm", external: ["@watchtowerobservability/browser"], outfile: "dist/index.js" });
