package com.wakemind.app.alarm

import android.content.Context
import android.util.Log

internal object SnoozeController {
  private val lock = Any()

  fun canSnooze(context: Context, alarmId: String, occurrenceId: String): Boolean {
    synchronized(lock) {
      if (!AlarmRingtoneService.isRinging) {
        return false
      }
      if (AlarmRingtoneService.currentRingingAlarmId != alarmId) {
        return false
      }
      if (AlarmRingtoneService.currentOccurrenceId != occurrenceId) {
        return false
      }
      if (AlarmRingtoneService.currentSnoozeCount >= 1) {
        return false
      }
      val existing = SnoozeStore(context).get(occurrenceId)
      if (existing != null && existing.isPending) {
        return false
      }
      return true
    }
  }

  fun requestSnooze(context: Context, alarmId: String, occurrenceId: String): Boolean {
    synchronized(lock) {
      val store = SnoozeStore(context)

      // 1. Validate active ringing occurrence
      if (!AlarmRingtoneService.isRinging) {
        Log.w(ALARM_LOG_TAG, "Snooze rejected: Alarm is not currently ringing.")
        return false
      }
      val activeAlarmId = AlarmRingtoneService.currentRingingAlarmId
      if (activeAlarmId != alarmId) {
        Log.w(ALARM_LOG_TAG, "Snooze rejected: Alarm ID mismatch (expected $activeAlarmId, got $alarmId)")
        return false
      }
      val activeOccurrenceId = AlarmRingtoneService.currentOccurrenceId
      if (activeOccurrenceId != occurrenceId) {
        Log.w(
            ALARM_LOG_TAG,
            "Snooze rejected: Occurrence ID mismatch (expected $activeOccurrenceId, got $occurrenceId)",
        )
        return false
      }

      // 2. Validate snooze has not been used for this occurrence (max 1 snooze)
      if (AlarmRingtoneService.currentSnoozeCount >= 1) {
        Log.w(ALARM_LOG_TAG, "Snooze rejected: Snooze limit reached for occurrence $occurrenceId")
        return false
      }

      // 3. Idempotency: check if pending snooze already exists for this occurrence
      val existing = store.get(occurrenceId)
      if (existing != null && existing.isPending) {
        Log.i(ALARM_LOG_TAG, "Snooze already pending for occurrence $occurrenceId; resolving idempotently.")
        return true
      }

      val currentAlarm =
          AlarmRingtoneService.currentAlarm
              ?: AlarmStore(context).get(alarmId)
              ?: throw IllegalStateException("Current ringing alarm $alarmId was not found in storage.")

      val triggerAtMillis = System.currentTimeMillis() + AlarmTime.SNOOZE_DURATION_MILLIS
      val record =
          SnoozeRecord(
              alarmId = alarmId,
              occurrenceId = occurrenceId,
              triggerAtMillis = triggerAtMillis,
              snoozeCount = 1,
              isPending = true,
              label = currentAlarm.label,
              vibrate = currentAlarm.vibrate,
              puzzleImageId = currentAlarm.puzzleImageId,
              puzzleImageType = currentAlarm.puzzleImageType,
              difficulty = currentAlarm.difficulty,
              sound = currentAlarm.sound,
              alarmType = currentAlarm.alarmType,
              ritualText = currentAlarm.ritualText,
              repetitionTarget = currentAlarm.repetitionTarget,
          )

      // 4. Persist SnoozeRecord atomically
      store.save(record)

      // 5. Schedule exact AlarmClock
      try {
        AlarmScheduler.scheduleSnooze(context, record)
      } catch (scheduleError: Exception) {
        Log.e(
            ALARM_LOG_TAG,
            "Snooze scheduling failed for occurrence $occurrenceId; rolling back persistence and keeping alarm ringing.",
            scheduleError,
        )
        // Failure safety: roll back snooze record and keep current alarm ringing!
        store.clear(occurrenceId)
        throw scheduleError
      }

      // 6. Only after scheduling succeeds, stop current audio and vibration, and finish activity
      AlarmRingtoneService.stop(context)
      RingingActivity.finishActive()
      AlarmNotifications.showSnoozeNotification(context, record)
      SnoozeCountdownNotifier.start(context, record)
      Log.i(ALARM_LOG_TAG, "Snooze successfully scheduled for occurrence $occurrenceId at $triggerAtMillis")
      return true
    }
  }

  fun cancelSnooze(context: Context, occurrenceId: String) {
    synchronized(lock) {
      val snoozeStore = SnoozeStore(context)
      val record = snoozeStore.get(occurrenceId) ?: return
      AlarmScheduler.cancelSnooze(context, record.alarmId, occurrenceId)
      snoozeStore.clear(occurrenceId)
      SnoozeCountdownNotifier.stop(occurrenceId)
      AlarmNotifications.cancelSnoozeNotification(context, occurrenceId)
      Log.i(ALARM_LOG_TAG, "Snooze cancelled for occurrence $occurrenceId")
    }
  }

  fun recoverPendingSnoozes(context: Context) {
    synchronized(lock) {
      val snoozeStore = SnoozeStore(context)
      val alarmStore = AlarmStore(context)
      val pendingList = snoozeStore.listPending()
      val now = System.currentTimeMillis()

      for (record in pendingList) {
        val alarm = alarmStore.get(record.alarmId)
        if (alarm == null) {
          Log.i(
              ALARM_LOG_TAG,
              "Alarm ${record.alarmId} was deleted while snooze was pending; clearing ${record.occurrenceId}",
          )
          AlarmScheduler.cancelSnooze(context, record.alarmId, record.occurrenceId)
          SnoozeCountdownNotifier.stop(record.occurrenceId)
          AlarmNotifications.cancelSnoozeNotification(context, record.occurrenceId)
          snoozeStore.clear(record.occurrenceId)
          continue
        }

        if (record.triggerAtMillis > now) {
          try {
            AlarmScheduler.scheduleSnooze(context, record)
            AlarmNotifications.showSnoozeNotification(context, record)
            SnoozeCountdownNotifier.start(context, record)
            Log.i(ALARM_LOG_TAG, "Recovered future snooze for ${record.occurrenceId} at ${record.triggerAtMillis}")
          } catch (e: Exception) {
            Log.e(ALARM_LOG_TAG, "Could not reschedule pending snooze for ${record.occurrenceId}", e)
          }
        } else {
          // Missed snooze: handle exactly once without creating duplicate schedules
          snoozeStore.markFired(record.occurrenceId)
          SnoozeCountdownNotifier.stop(record.occurrenceId)
          AlarmNotifications.cancelSnoozeNotification(context, record.occurrenceId)
          try {
            AlarmRingtoneService.start(context, alarm, record.occurrenceId, snoozeCount = 1)
            Log.i(ALARM_LOG_TAG, "Recovered expired snooze for ${record.occurrenceId}; ringing now.")
          } catch (e: Exception) {
            Log.e(ALARM_LOG_TAG, "Failed to start ringing for missed snooze ${record.occurrenceId}", e)
          }
        }
      }
    }
  }
}
