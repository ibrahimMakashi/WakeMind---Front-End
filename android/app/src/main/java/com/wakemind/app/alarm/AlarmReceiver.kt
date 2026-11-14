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
    val isSnooze = intent.getBooleanExtra(AlarmIntents.EXTRA_IS_SNOOZE, false)
    val occurrenceId = intent.getStringExtra(AlarmIntents.EXTRA_OCCURRENCE_ID)
    handleAlarmFired(context, alarmId, isSnooze, occurrenceId)
  }

  internal fun handleAlarmFired(
      context: Context,
      alarmId: String,
      isSnooze: Boolean = false,
      occurrenceId: String? = null,
  ) {
    val store = AlarmStore(context)
    val alarm =
        try {
          store.get(alarmId)
        } catch (error: Exception) {
          Log.e(ALARM_LOG_TAG, "Failed to load alarm $alarmId from store.", error)
          null
        }

    if (alarm == null) {
      if (isSnooze) {
        Log.i(ALARM_LOG_TAG, "Snooze fired for deleted alarm $alarmId; cleaning up snooze store and aborting.")
        if (!occurrenceId.isNullOrBlank()) {
          SnoozeStore(context).clear(occurrenceId)
        }
      } else {
        Log.e(ALARM_LOG_TAG, "Alarm $alarmId fired but it is not in local storage.")
      }
      return
    }

    if (isSnooze) {
      // 1. Snooze fire: reuse original occurrenceId and NEVER touch weekly recurrence
      val finalOccurrenceId =
          occurrenceId
              ?: SnoozeStore(context).getPendingForAlarm(alarmId)?.occurrenceId
              ?: "${alarmId}_${System.currentTimeMillis()}"

      try {
        SnoozeStore(context).markFired(finalOccurrenceId)
      } catch (e: Exception) {
        Log.e(ALARM_LOG_TAG, "Failed to mark snooze record fired for $finalOccurrenceId", e)
      }

      try {
        AlarmRingtoneService.start(context, alarm, finalOccurrenceId, snoozeCount = 1)
        Log.i(ALARM_LOG_TAG, "Snooze alarm $alarmId ($finalOccurrenceId) started ringing with snoozeCount=1.")
      } catch (ringError: Exception) {
        Log.e(ALARM_LOG_TAG, "Failed to start ringtone service for snoozed alarm $alarmId.", ringError)
      }
      return
    }

    // 2. Normal alarm fire: generate a fresh unique occurrenceId before starting ringing
    val freshOccurrenceId = "${alarmId}_${System.currentTimeMillis()}_${java.util.UUID.randomUUID()}"

    // Recurrence and firing state maintenance (with isolated error handling)
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

    // ALWAYS attempt to start the current alarm ringing with snoozeCount=0
    try {
      AlarmRingtoneService.start(context, alarm, freshOccurrenceId, snoozeCount = 0)
      Log.i(ALARM_LOG_TAG, "Alarm $alarmId ($freshOccurrenceId) started ringing with snoozeCount=0.")
    } catch (ringError: Exception) {
      Log.e(ALARM_LOG_TAG, "Failed to start ringtone service for alarm $alarmId.", ringError)
    }
  }
}
