package com.wakemind.app.alarm

internal object FullScreenPolicy {
  const val ANDROID_14 = 34

  fun decide(sdkInt: Int, canUseFullScreenIntent: Boolean): String {
    if (sdkInt < ANDROID_14) {
      return "granted"
    }
    return if (canUseFullScreenIntent) "granted" else "needsSettings"
  }
}
