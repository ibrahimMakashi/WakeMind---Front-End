package com.wakemind.app.alarm

import android.app.NotificationManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import android.Manifest
import android.content.pm.PackageManager

class AlarmModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = NAME

  @ReactMethod
  fun getAlarms(promise: Promise) {
    try {
      promise.resolve(alarmsToArray(AlarmStore(reactApplicationContext).list()))
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Could not read alarms.", error)
      promise.reject("ALARM_STORE_ERROR", error.message, error)
    }
  }

  @ReactMethod
  fun saveAlarm(payload: ReadableMap, promise: Promise) {
    try {
      val saved =
          AlarmController.saveClockAlarm(
              reactApplicationContext,
              id = optionalString(payload, "id"),
              hour = requiredInt(payload, "hour"),
              minute = requiredInt(payload, "minute"),
              enabled = if (payload.hasKey("enabled")) payload.getBoolean("enabled") else true,
              vibrate = if (payload.hasKey("vibrate")) payload.getBoolean("vibrate") else true,
              label = optionalString(payload, "label"),
          )
      promise.resolve(alarmToMap(saved))
    } catch (error: AlarmScheduleException) {
      promise.reject(errorCode(error), error.message, error)
    } catch (error: IllegalArgumentException) {
      promise.reject("ALARM_VALIDATION", error.message, error)
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Could not save alarm.", error)
      promise.reject("ALARM_SAVE_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun setEnabled(id: String, enabled: Boolean, promise: Promise) {
    try {
      val updated = AlarmController.setEnabled(reactApplicationContext, id, enabled)
      promise.resolve(alarmToMap(updated))
    } catch (error: AlarmScheduleException) {
      promise.reject(errorCode(error), error.message, error)
    } catch (error: IllegalArgumentException) {
      promise.reject("ALARM_VALIDATION", error.message, error)
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Could not update alarm $id.", error)
      promise.reject("ALARM_UPDATE_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun deleteAlarm(id: String, promise: Promise) {
    try {
      AlarmController.delete(reactApplicationContext, id)
      promise.resolve(null)
    } catch (error: IllegalArgumentException) {
      promise.reject("ALARM_VALIDATION", error.message, error)
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Could not delete alarm $id.", error)
      promise.reject("ALARM_DELETE_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun scheduleTestAlarm(offsetSeconds: Double, promise: Promise) {
    try {
      val saved = AlarmController.scheduleTestAlarm(reactApplicationContext, offsetSeconds.toInt())
      promise.resolve(alarmToMap(saved))
    } catch (error: AlarmScheduleException) {
      promise.reject(errorCode(error), error.message, error)
    } catch (error: IllegalArgumentException) {
      promise.reject("ALARM_VALIDATION", error.message, error)
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Could not schedule test alarm.", error)
      promise.reject("ALARM_SAVE_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun stopRinging(promise: Promise) {
    try {
      AlarmRingtoneService.stop(reactApplicationContext)
      promise.resolve(null)
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Could not stop the alarm.", error)
      promise.reject("ALARM_STOP_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun getCapabilityStatus(promise: Promise) {
    try {
      val status = Arguments.createMap()
      status.putString(
          "exactAlarm",
          ExactAlarmPolicy.toStatus(AlarmScheduler.currentAccess(reactApplicationContext)),
      )
      status.putString("fullScreenIntent", fullScreenStatus())
      status.putString("notifications", notificationStatus())
      promise.resolve(status)
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Could not read alarm capabilities.", error)
      promise.reject("ALARM_CAPABILITY_ERROR", error.message, error)
    }
  }

  @ReactMethod
  fun openExactAlarmSettings(promise: Promise) {
    val access = AlarmScheduler.currentAccess(reactApplicationContext)
    if (access != ExactAlarmAccess.NEEDS_SCHEDULE_EXACT_ALARM_GRANT) {
      promise.reject(
          "EXACT_ALARM_SETTINGS_NOT_APPLICABLE",
          "Exact-alarm settings are only used on Android 12 when SCHEDULE_EXACT_ALARM is not granted.",
      )
      return
    }
    try {
      val intent =
          Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
            data = Uri.fromParts("package", reactApplicationContext.packageName, null)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
      reactApplicationContext.startActivity(intent)
      promise.resolve(null)
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Could not open exact-alarm settings.", error)
      promise.reject("EXACT_ALARM_SETTINGS_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun openFullScreenIntentSettings(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      promise.reject(
          "FULL_SCREEN_SETTINGS_NOT_APPLICABLE",
          "Full-screen intent settings are only used on Android 14 and later.",
      )
      return
    }
    if (fullScreenStatus() != "needsSettings") {
      promise.reject(
          "FULL_SCREEN_SETTINGS_NOT_APPLICABLE",
          "Full-screen intents are already allowed.",
      )
      return
    }
    try {
      val intent =
          Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
            data = Uri.fromParts("package", reactApplicationContext.packageName, null)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
      reactApplicationContext.startActivity(intent)
      promise.resolve(null)
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Could not open full-screen intent settings.", error)
      promise.reject("FULL_SCREEN_SETTINGS_FAILED", error.message, error)
    }
  }

  private fun fullScreenStatus(): String {
    val canUse =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
          reactApplicationContext
              .getSystemService(NotificationManager::class.java)
              .canUseFullScreenIntent()
        } else {
          true
        }
    return FullScreenPolicy.decide(Build.VERSION.SDK_INT, canUse)
  }

  private fun notificationStatus(): String {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      return "notRequired"
    }
    val granted =
        ContextCompat.checkSelfPermission(
            reactApplicationContext,
            Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED
    return if (granted) "granted" else "denied"
  }

  private fun alarmsToArray(alarms: List<StoredAlarm>): WritableArray {
    val array = Arguments.createArray()
    alarms.forEach { alarm -> array.pushMap(alarmToMap(alarm)) }
    return array
  }

  private fun alarmToMap(alarm: StoredAlarm): WritableMap {
    val map = Arguments.createMap()
    map.putString("id", alarm.id)
    map.putInt("hour", alarm.hour)
    map.putInt("minute", alarm.minute)
    map.putBoolean("enabled", alarm.enabled)
    map.putBoolean("vibrate", alarm.vibrate)
    map.putString("label", alarm.label)
    map.putString("repeat", alarm.repeat)
    map.putString("difficulty", alarm.difficulty)
    map.putString("sound", alarm.sound)
    map.putDouble("triggerAtMillis", alarm.triggerAtMillis.toDouble())
    map.putDouble("createdAtMillis", alarm.createdAtMillis.toDouble())
    return map
  }

  private fun requiredInt(payload: ReadableMap, key: String): Int {
    if (!payload.hasKey(key) || payload.isNull(key)) {
      throw IllegalArgumentException("Missing $key.")
    }
    return payload.getDouble(key).toInt()
  }

  private fun optionalString(payload: ReadableMap, key: String): String? {
    if (!payload.hasKey(key) || payload.isNull(key)) {
      return null
    }
    return payload.getString(key)
  }

  private fun errorCode(error: AlarmScheduleException): String {
    return when (error.access) {
      ExactAlarmAccess.NEEDS_SCHEDULE_EXACT_ALARM_GRANT -> "EXACT_ALARM_NEEDS_GRANT"
      ExactAlarmAccess.UNAVAILABLE -> "EXACT_ALARM_UNAVAILABLE"
      ExactAlarmAccess.GRANTED -> "ALARM_SCHEDULE_FAILED"
    }
  }

  companion object {
    const val NAME = "AlarmModule"
  }
}
