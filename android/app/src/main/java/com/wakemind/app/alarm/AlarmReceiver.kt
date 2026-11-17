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
    val intentAlarmType = intent.getStringExtra(AlarmIntents.EXTRA_ALARM_TYPE)
    val intentRitualText = intent.getStringExtra(AlarmIntents.EXTRA_RITUAL_TEXT)
    val intentRepetitionTarget = intent.getIntExtra(AlarmIntents.EXTRA_REPETITION_TARGET, -1)
    handleAlarmFired(
        context,
        alarmId,
        isSnooze,
        occurrenceId,
        intentAlarmType,
        intentRitualText,
        intentRepetitionTarget,
    )
  }

  internal fun handleAlarmFired(
      context: Context,
      alarmId: String,
      isSnooze: Boolean = false,
      occurrenceId: String? = null,
      intentAlarmType: String? = null,
      intentRitualText: String? = null,
      intentRepetitionTarget: Int = -1,
  ) {
    val store = AlarmStore(context)
    val rawAlarm =
        try {
          store.get(alarmId)
        } catch (error: Exception) {
          Log.e(ALARM_LOG_TAG, "Failed to load alarm $alarmId from store.", error)
          null
        }

    val alarm = rawAlarm?.let {
      val resolvedType = intentAlarmType?.takeIf { t -> t.isNotBlank() } ?: it.alarmType
      val resolvedText = intentRitualText?.takeIf { t -> t.isNotBlank() } ?: it.ritualText
      val resolvedTarget = if (intentRepetitionTarget > 0) intentRepetitionTarget else it.repetitionTarget
      if (resolvedType != it.alarmType || resolvedText != it.ritualText || resolvedTarget != it.repetitionTarget) {
        it.copy(alarmType = resolvedType, ritualText = resolvedText, repetitionTarget = resolvedTarget)
      } else {
        it
      }
    }

    if (alarm == null) {
      if (isSnooze) {
        Log.w(ALARM_LOG_TAG, "Snooze fire rejected: alarm $alarmId does not exist in store.")
        if (!occurrenceId.isNullOrBlank()) {
          SnoozeStore(context).clear(occurrenceId)
        }
      } else {
        Log.e(ALARM_LOG_TAG, "Alarm $alarmId fired but it is not in local storage.")
      }
      return
    }

    if (isSnooze) {
      // Snooze fire validation: strictly require valid alarmId, occurrenceId, and valid pending record
      if (occurrenceId.isNullOrBlank()) {
        Log.w(ALARM_LOG_TAG, "Snooze fire rejected: missing occurrenceId for alarm $alarmId.")
        return
      }

      val snoozeStore = SnoozeStore(context)
      val record = snoozeStore.get(occurrenceId)
      if (record == null) {
        Log.w(ALARM_LOG_TAG, "Snooze fire rejected: no SnoozeRecord found for occurrence $occurrenceId.")
        return
      }

      if (record.alarmId != alarmId) {
        Log.w(
            ALARM_LOG_TAG,
            "Snooze fire rejected: alarmId mismatch (expected ${record.alarmId}, got $alarmId for occurrence $occurrenceId).",
        )
        return
      }

      if (record.occurrenceId != occurrenceId) {
        Log.w(ALARM_LOG_TAG, "Snooze fire rejected: occurrenceId mismatch for occurrence $occurrenceId.")
        return
      }

      if (!record.isPending) {
        Log.w(ALARM_LOG_TAG, "Snooze fire rejected: snooze for occurrence $occurrenceId is already consumed/expired.")
        return
      }

      if (record.snoozeCount != 1) {
        Log.w(
            ALARM_LOG_TAG,
            "Snooze fire rejected: invalid snoozeCount ${record.snoozeCount} for occurrence $occurrenceId.",
        )
        return
      }

      val now = System.currentTimeMillis()
      // Reject if trigger time is far in the future (> 60 seconds)
      if (record.triggerAtMillis > now + 60_000L) {
        Log.w(
            ALARM_LOG_TAG,
            "Snooze fire rejected: trigger time is in the future (${record.triggerAtMillis} vs now $now).",
        )
        return
      }

      // Atomically consume pending record to prevent duplicate fires from ringing again
      val consumed = snoozeStore.consumePending(alarmId, occurrenceId)
      if (consumed == null) {
        Log.w(
            ALARM_LOG_TAG,
            "Snooze fire rejected: duplicate or concurrent delivery already consumed occurrence $occurrenceId.",
        )
        return
      }

      SnoozeCountdownNotifier.stop(occurrenceId)
      AlarmNotifications.cancelSnoozeNotification(context, occurrenceId)

      try {
        AlarmRingtoneService.start(context, alarm, occurrenceId, snoozeCount = 1)
        Log.i(ALARM_LOG_TAG, "Snooze alarm $alarmId ($occurrenceId) successfully started ringing with snoozeCount=1.")
      } catch (ringError: Exception) {
        Log.e(ALARM_LOG_TAG, "Failed to start ringtone service for snoozed alarm $alarmId ($occurrenceId).", ringError)
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
