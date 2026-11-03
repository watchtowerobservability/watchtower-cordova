// Cordova glue with injected dependencies so it runs under vitest (no webview, no device).
import type { WatchtowerClient, WatchtowerConfig } from "@watchtowerobservability/browser";

export interface InitOptions {
  /** Publishable ingest key. Sent as `Authorization: Bearer`, never logged. */
  publishableKey: string;
  /** Edge base URL. */
  endpoint: string;
  service: string;
  release?: string;
  environment?: string;
  /** Redaction hook of the browser SDK. */
  beforeSend?: WatchtowerConfig["beforeSend"];
  /** Masked replay: DOM recording in the webview, screenshot replay by the native SDK on devices. */
  replay?: WatchtowerConfig["replay"];
  /** Set false to skip the native iOS/Android SDK (native crashes, ANR/hangs) on devices (default true). */
  native?: boolean;
}

/** cordova-plugin-device's `window.device`, when the app has it. */
export interface Device {
  platform?: string;
  version?: string;
  model?: string;
  manufacturer?: string;
  cordova?: string;
}

/** `cordova.exec` bound to the plugin's native service. */
export type Exec = (action: "start" | "flush", args: unknown[]) => Promise<void>;

export interface Deps {
  browser: { init(c: WatchtowerConfig): WatchtowerClient };
  /** The document that receives the Cordova events (deviceready, pause, resume). */
  doc: Pick<Document, "addEventListener" | "removeEventListener">;
  getDevice: () => Device | undefined;
  /** Native bridge; undefined in a plain browser (cordova serve) or when the plugin is not installed. */
  exec?: Exec;
}

const REQUIRED = ["publishableKey", "endpoint", "service"] as const;

export function deviceAttrs(device: Device | undefined): Record<string, string> {
  if (!device) return {};
  const a: Record<string, string | undefined> = {
    "os.name": device.platform,
    "os.version": device.version,
    "device.model.identifier": device.model,
    "device.manufacturer": device.manufacturer,
    "cordova.version": device.cordova,
  };
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(a)) if (v) out[k] = v;
  return out;
}

const NATIVE_PLATFORMS = new Set(["ios", "android"]);

export function createWatchtower({ browser, doc, getDevice, exec }: Deps) {
  let web: WatchtowerClient | undefined;
  let opts: InitOptions | undefined;
  let nativeStarted = false;
  const onPause = () => {
    // the OS may suspend or kill the app after pause: send what is queued now
    if (web) void web.replay.flush();
    if (nativeStarted) void exec?.("flush", []).catch(() => undefined);
  };
  const onResume = () => web?.event("app.resume");
  const onReady = () => {
    if (!web || !opts) return;
    const device = getDevice();
    for (const [k, v] of Object.entries(deviceAttrs(device))) web.setAttribute(k, v);
    if (!nativeStarted && exec && opts.native !== false && NATIVE_PLATFORMS.has((device?.platform ?? "").toLowerCase())) {
      nativeStarted = true;
      const o = opts;
      exec("start", [{ key: o.publishableKey, endpoint: o.endpoint, service: o.service, release: o.release, environment: o.environment, replay: !!o.replay }])
        .catch(() => { nativeStarted = false; }); // webview SDK keeps working without the native one
    }
  };
  // cordova.exec works only after deviceready, and the native SDK records the screen itself:
  // when it will run, the DOM recorder would duplicate it.
  const nativeExpected = (o: InitOptions) => !!exec && o.native !== false;
  return {
    /** Starts the browser SDK; device attributes and the native SDK follow on deviceready. */
    init(o: InitOptions): WatchtowerClient {
      for (const k of REQUIRED) if (!o?.[k]) throw new Error(`${k} is required`);
      opts = o;
      web = browser.init({
        publishableKey: o.publishableKey,
        endpoint: o.endpoint,
        service: o.service,
        release: o.release,
        environment: o.environment,
        beforeSend: o.beforeSend,
        replay: nativeExpected(o) ? undefined : o.replay,
      });
      doc.addEventListener("deviceready", onReady, false);
      doc.addEventListener("pause", onPause, false);
      doc.addEventListener("resume", onResume, false);
      if (getDevice()) onReady(); // init after deviceready already fired
      return web;
    },
    captureError(err: unknown, ctx?: Record<string, string | number | boolean>): void {
      web?.captureError(err, ctx);
    },
    async flush(): Promise<void> {
      if (nativeStarted) await exec?.("flush", []);
      if (web) await web.replay.flush();
    },
    async shutdown(): Promise<void> {
      doc.removeEventListener("deviceready", onReady, false);
      doc.removeEventListener("pause", onPause, false);
      doc.removeEventListener("resume", onResume, false);
      if (web) await web.shutdown();
      web = undefined;
    },
  };
}
