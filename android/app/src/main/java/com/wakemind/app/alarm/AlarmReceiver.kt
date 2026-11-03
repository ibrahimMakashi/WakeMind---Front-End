package com.wakemind.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import java.util.TimeZone

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val alarmId = intent.getStringExtra(AlarmIntents.EXTRA_ALARM_ID)
    if (alarmId.isNullOrBlank()) {
      Log.e(ALARM_LOG_TAG, "Alarm fired without an id.")
      return
    }
    handleAlarmFired(context, alarmId)
  }

  internal fun handleAlarmFired(context: Context, alarmId: String) {
    val store = AlarmStore(context)
    val alarm =
        try {
          store.get(alarmId)
        } catch (error: Exception) {
          Log.e(ALARM_LOG_TAG, "Failed to load alarm $alarmId from store.", error)
          null
        }

    if (alarm == null) {
      Log.e(ALARM_LOG_TAG, "Alarm $alarmId fired but it is not in local storage.")
      return
    }

    // 1. Recurrence and firing state maintenance (with isolated error handling)
    if (alarm.repeatDays.isNotEmpty()) {
      try {
        val nextTrigger =
            AlarmTime.nextWeeklyTriggerMillis(
                alarm.hour,
                alarm.minute,
                alarm.repeatDays,
                System.currentTimeMillis(),
                TimeZone.getDefault(),
            )
        val recurringAlarm = alarm.copy(enabled = true, triggerAtMillis = nextTrigger)
        store.upsert(recurringAlarm)

        try {
          AlarmScheduler.schedule(context, recurringAlarm)
        } catch (scheduleError: Exception) {
          Log.e(
              ALARM_LOG_TAG,
              "Failed to schedule next weekly recurrence for alarm $alarmId.",
              scheduleError,
          )
        }
      } catch (recurrenceError: Exception) {
        Log.e(
            ALARM_LOG_TAG,
            "Failed to calculate next trigger or update store for recurring alarm $alarmId.",
            recurrenceError,
        )
      }
    } else {
      try {
        store.markFired(alarmId)
        AlarmScheduler.cancel(context, alarmId)
      } catch (stateError: Exception) {
        Log.e(ALARM_LOG_TAG, "Failed to update fired state for one-time alarm $alarmId.", stateError)
      }
    }

    // 2. ALWAYS attempt to start the current alarm ringing, independent of recurrence scheduling
    try {
      AlarmRingtoneService.start(context, alarm)
      Log.i(ALARM_LOG_TAG, "Alarm $alarmId started ringing.")
    } catch (ringError: Exception) {
      Log.e(ALARM_LOG_TAG, "Failed to start ringtone service for alarm $alarmId.", ringError)
    }
  }
}
