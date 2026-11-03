// Build-only stand-in for the browser SDK so declaration emit stays inside src/. Emitted .d.ts keep
// the "@watchtowerobservability/browser" import, so apps see the SDK's real types; `typecheck`
// checks against the SDK source (tsconfig.json paths).
export type WatchtowerConfig = { [k: string]: any; publishableKey: string; endpoint: string; service: string };
export type WatchtowerClient = any;
export declare function init(c: WatchtowerConfig): WatchtowerClient;
