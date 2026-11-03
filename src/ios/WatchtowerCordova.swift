import Cordova
import Watchtower

/// Bridge to the native iOS SDK: crashes, hangs, app start, frame metrics and screenshot replay.
@objc(WatchtowerCordova)
class WatchtowerCordova: CDVPlugin {
    @objc(start:)
    func start(_ command: CDVInvokedUrlCommand) {
        guard let o = command.arguments.first as? [String: Any],
              let key = o["key"] as? String, let service = o["service"] as? String,
              let endpoint = o["endpoint"] as? String else {
            send(command, CDVPluginResult(status: .error, messageAs: "key, service and endpoint are required"))
            return
        }
        var cfg = Config(key: key, service: service)
        cfg.endpoint = endpoint
        cfg.release = o["release"] as? String
        cfg.environment = o["environment"] as? String
        cfg.replay.enabled = o["replay"] as? Bool ?? false
        Watchtower.start(cfg)
        send(command, CDVPluginResult(status: .ok))
    }

    @objc(flush:)
    func flush(_ command: CDVInvokedUrlCommand) {
        Watchtower.shared.flush()
        send(command, CDVPluginResult(status: .ok))
    }

    private func send(_ command: CDVInvokedUrlCommand, _ result: CDVPluginResult) {
        commandDelegate.send(result, callbackId: command.callbackId)
    }
}
