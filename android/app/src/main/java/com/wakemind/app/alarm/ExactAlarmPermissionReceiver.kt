package com.wakemind.app.alarm

import android.app.AlarmManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class ExactAlarmPermissionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED) {
      return
    }
    if (Build.VERSION.SDK_INT > Build.VERSION_CODES.S_V2) {
      Log.i(
          ALARM_LOG_TAG,
          "Ignoring exact-alarm grant broadcast on API ${Build.VERSION.SDK_INT}.",
      )
      return
    }
    val access = AlarmScheduler.currentAccess(context)
    if (access != ExactAlarmAccess.GRANTED) {
      Log.w(ALARM_LOG_TAG, "Exact-alarm grant broadcast arrived while access is $access.")
      return
    }
    try {
      AlarmScheduler.rescheduleEnabled(context)
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Failed to reschedule after exact-alarm grant", error)
    }
  }
}
