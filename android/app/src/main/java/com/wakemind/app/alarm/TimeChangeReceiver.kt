package com.wakemind.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class TimeChangeReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action
    if (action != Intent.ACTION_TIME_CHANGED && action != Intent.ACTION_TIMEZONE_CHANGED) {
      return
    }
    try {
      AlarmScheduler.rescheduleEnabled(context)
      Log.i(ALARM_LOG_TAG, "Rescheduled alarms after $action")
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Failed to reschedule alarms after $action", error)
    }
  }
}
