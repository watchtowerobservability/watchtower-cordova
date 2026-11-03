# @watchtowerobservability/cordova

Watchtower for [Apache Cordova](https://cordova.apache.org) apps, in TypeScript.

- The [browser SDK](https://github.com/watchtowerobservability/watchtower-browser) runs in the webview: JS errors,
  web vitals, sessions, logs, masked DOM replay.
- On iOS and Android devices the plugin also starts the native
  [iOS](https://github.com/watchtowerobservability/watchtower-ios) or
  [Android](https://github.com/watchtowerobservability/watchtower-android) SDK: native crashes, ANR/hangs, app start,
  frame metrics and masked screenshot replay (which then replaces the DOM recorder, so the screen is recorded once).
- Cordova lifecycle: queued data is sent on `pause` (the OS may suspend the app right after), `resume` is recorded as
  an `app.resume` event, and on `deviceready` the session gets `os.name`, `os.version`, `device.model.identifier` and
  `device.manufacturer` from [cordova-plugin-device](https://github.com/apache/cordova-plugin-device) when installed.

## Install

```sh
npm install @watchtowerobservability/cordova @watchtowerobservability/browser
cordova plugin add @watchtowerobservability/cordova   # native bridge
cordova plugin add cordova-plugin-device              # optional, device attributes
```

- iOS: cordova-ios 8 or later (the plugin is a Swift package that pulls `watchtower-ios`).
- Android: cordova-android 12 or later with `<preference name="GradlePluginKotlinEnabled" value="true" />` in
  `config.xml`. The Android SDK is not on a Maven registry yet: add `include ':watchtower-android'` to
  `platforms/android/settings.gradle` and point `project(':watchtower-android').projectDir` at the downloaded
  `watchtower-android` sources.

Bundle `www/` with your usual bundler (Vite, webpack, esbuild).

## Quick start

```ts
import { init } from "@watchtowerobservability/cordova";

init({
  publishableKey: "PUBLISHABLE_KEY",
  endpoint: "https://edge.example.com",
  service: "my-app",
  release: "1.2.3",
  environment: "production",
});
```

`native: false` keeps everything in the webview. Allow the edge host in `config.xml`
(`<access origin="https://edge.example.com" />`) and in your Content-Security-Policy `connect-src`.

## Develop

```sh
pnpm install && pnpm typecheck && pnpm build && pnpm test
```
