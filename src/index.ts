import * as browser from "@watchtowerobservability/browser";
import { createWatchtower, type Device, type Exec } from "./core";

export type { InitOptions } from "./core";

type CordovaGlobal = { exec(ok: () => void, fail: (e: unknown) => void, service: string, action: string, args: unknown[]): void };
const g = globalThis as { cordova?: CordovaGlobal; device?: Device };

const exec: Exec | undefined = g.cordova
  ? (action, args) => new Promise((resolve, reject) => g.cordova!.exec(resolve, reject, "Watchtower", action, args))
  : undefined;

const wt = createWatchtower({ browser, doc: document, getDevice: () => g.device, exec });

export const init = wt.init;
export const captureError = wt.captureError;
export const flush = wt.flush;
export const shutdown = wt.shutdown;
