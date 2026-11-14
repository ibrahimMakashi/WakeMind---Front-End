package com.wakemind.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class AlarmActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != AlarmIntents.ACTION_SNOOZE) {
      return
    }
    val alarmId = intent.getStringExtra(AlarmIntents.EXTRA_ALARM_ID)
    val occurrenceId = intent.getStringExtra(AlarmIntents.EXTRA_OCCURRENCE_ID)

    if (alarmId.isNullOrBlank() || occurrenceId.isNullOrBlank()) {
      Log.e(ALARM_LOG_TAG, "Snooze action received without valid alarmId or occurrenceId.")
      return
    }

    try {
      SnoozeController.requestSnooze(context, alarmId, occurrenceId)
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Failed to handle notification snooze action for occurrence $occurrenceId", error)
    }
  }
}
