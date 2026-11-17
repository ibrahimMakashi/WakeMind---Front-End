package com.wakemind.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class AlarmActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action
    if (action != AlarmIntents.ACTION_SNOOZE &&
        action != AlarmIntents.ACTION_CANCEL_SNOOZE &&
        action != AlarmIntents.ACTION_STOP) {
      return
    }
    val alarmId = intent.getStringExtra(AlarmIntents.EXTRA_ALARM_ID)
    val occurrenceId = intent.getStringExtra(AlarmIntents.EXTRA_OCCURRENCE_ID)

    if (alarmId.isNullOrBlank() || occurrenceId.isNullOrBlank()) {
      Log.e(ALARM_LOG_TAG, "Alarm action received without valid alarmId or occurrenceId.")
      return
    }

    if (action == AlarmIntents.ACTION_CANCEL_SNOOZE || action == AlarmIntents.ACTION_STOP) {
      try {
        SnoozeController.cancelSnooze(context, occurrenceId)
      } catch (error: Exception) {
        Log.e(ALARM_LOG_TAG, "Failed to cancel snooze for occurrence $occurrenceId", error)
      }
      return
    }

    try {
      SnoozeController.requestSnooze(context, alarmId, occurrenceId)
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Failed to handle notification snooze action for occurrence $occurrenceId", error)
    }
  }
}
