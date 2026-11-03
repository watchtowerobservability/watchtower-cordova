package dev.watchtower.cordova

import dev.watchtower.Config
import dev.watchtower.ReplayConfig
import dev.watchtower.Watchtower
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.json.JSONArray

/** Bridge to the native Android SDK: crashes, ANR, app start, frame metrics and screenshot replay. */
class WatchtowerCordova : CordovaPlugin() {
    override fun execute(action: String, args: JSONArray, cb: CallbackContext): Boolean {
        when (action) {
            "start" -> {
                val o = args.optJSONObject(0)
                val key = o?.optString("key").orEmpty()
                val service = o?.optString("service").orEmpty()
                val endpoint = o?.optString("endpoint").orEmpty()
                if (key.isEmpty() || service.isEmpty() || endpoint.isEmpty()) {
                    cb.error("key, service and endpoint are required")
                    return true
                }
                Watchtower.init(
                    cordova.activity.application,
                    Config(
                        key = key,
                        service = service,
                        endpoint = endpoint,
                        release = o?.optString("release")?.takeIf { it.isNotEmpty() },
                        environment = o?.optString("environment")?.takeIf { it.isNotEmpty() },
                        replay = ReplayConfig(enabled = o?.optBoolean("replay", false) == true),
                    ),
                )
                cb.success()
            }
            "flush" -> {
                Watchtower.flush()
                cb.success()
            }
            else -> return false
        }
        return true
    }
}
