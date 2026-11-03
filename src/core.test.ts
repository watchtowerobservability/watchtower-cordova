import { describe, expect, it } from "vitest";
import type { WatchtowerClient, WatchtowerConfig } from "@watchtowerobservability/browser";
import { createWatchtower, deviceAttrs, type Device, type Exec, type InitOptions } from "./core";

function fakes(device: Device | undefined, withNative = false) {
  const calls: unknown[][] = [];
  const handlers: Record<string, () => void> = {};
  const client = {
    captureError: (e: unknown) => calls.push(["capture", e]),
    setAttribute: (k: string, v: string) => calls.push(["attr", k, v]),
    event: (n: string) => calls.push(["event", n]),
    replay: { flush: async () => void calls.push(["flush"]) },
    shutdown: async () => void calls.push(["shutdown"]),
  } as unknown as WatchtowerClient;
  let dev = device;
  const exec: Exec = async (action, args) => void calls.push(["native", action, args[0]]);
  return {
    calls,
    handlers,
    setDevice: (d: Device) => { dev = d; },
    deps: {
      browser: { init: (c: WatchtowerConfig) => { calls.push(["browser", c]); return client; } },
      doc: {
        addEventListener: (n: string, f: () => void) => { handlers[n] = f; },
        removeEventListener: (n: string) => { delete handlers[n]; },
      } as unknown as Pick<Document, "addEventListener" | "removeEventListener">,
      getDevice: () => dev,
      exec: withNative ? exec : undefined,
    },
  };
}
const opts: InitOptions = { publishableKey: "pk", endpoint: "http://e", service: "s" };
const kinds = (c: unknown[][]) => c.map((x) => x[0]);

describe("cordova", () => {
  it("device attributes are added on deviceready", () => {
    const f = fakes(undefined);
    createWatchtower(f.deps).init(opts);
    expect(f.calls.filter((c) => c[0] === "attr")).toHaveLength(0);
    f.setDevice({ platform: "Android", version: "14", model: "Pixel 8", manufacturer: "Google", cordova: "12.0.0" });
    f.handlers.deviceready!();
    expect(f.calls.find((c) => c[0] === "attr" && c[1] === "os.name")).toEqual(["attr", "os.name", "Android"]);
  });

  it("init after deviceready reads the device at once", () => {
    const f = fakes({ platform: "iOS" });
    createWatchtower(f.deps).init(opts);
    expect(f.calls.filter((c) => c[0] === "attr")).toEqual([["attr", "os.name", "iOS"]]);
  });

  it("native SDK starts on iOS/Android deviceready, once, and takes over replay", async () => {
    const f = fakes(undefined, true);
    const wt = createWatchtower(f.deps);
    wt.init({ ...opts, replay: { enabled: true } as WatchtowerConfig["replay"] });
    expect((f.calls[0]![1] as WatchtowerConfig).replay).toBeUndefined();
    f.setDevice({ platform: "iOS" });
    f.handlers.deviceready!();
    f.handlers.deviceready!();
    const native = f.calls.filter((c) => c[0] === "native");
    expect(native).toEqual([["native", "start", { key: "pk", endpoint: "http://e", service: "s", release: undefined, environment: undefined, replay: true }]]);
    await wt.flush();
    expect(f.calls.slice(-2).map((c) => c[1] ?? c[0])).toEqual(["flush", "flush"]);
  });

  it("no native start in the browser platform, without the plugin, or with native:false", () => {
    for (const [device, withNative, o] of [
      [{ platform: "browser" }, true, opts],
      [{ platform: "Android" }, false, opts],
      [{ platform: "Android" }, true, { ...opts, native: false }],
    ] as const) {
      const f = fakes(device, withNative);
      createWatchtower(f.deps).init(o);
      expect(f.calls.some((c) => c[0] === "native")).toBe(false);
    }
  });

  it("pause flushes, resume records an event, shutdown detaches", async () => {
    const f = fakes(undefined);
    const wt = createWatchtower(f.deps);
    wt.init(opts);
    f.handlers.pause!();
    f.handlers.resume!();
    await wt.shutdown();
    expect(kinds(f.calls.slice(1))).toEqual(["flush", "event", "shutdown"]);
    expect(Object.keys(f.handlers)).toEqual([]);
  });

  it("required options are checked and empty device fields dropped", () => {
    const f = fakes(undefined);
    expect(() => createWatchtower(f.deps).init({ endpoint: "x", service: "s" } as InitOptions)).toThrow(/publishableKey/);
    expect(deviceAttrs({ platform: "Android", model: "" })).toEqual({ "os.name": "Android" });
    expect(deviceAttrs(undefined)).toEqual({});
  });
});
