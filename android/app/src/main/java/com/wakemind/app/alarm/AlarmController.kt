package com.wakemind.app.alarm

import android.content.Context
import java.util.Calendar
import java.util.TimeZone
import java.util.UUID

internal object AlarmController {
  fun saveClockAlarm(
      context: Context,
      id: String?,
      hour: Int,
      minute: Int,
      enabled: Boolean,
      vibrate: Boolean,
      label: String?,
      puzzleImageId: String? = null,
      puzzleImageType: String? = null,
      difficulty: String? = null,
      repeatDays: List<String>? = null,
  ): StoredAlarm {
    val store = AlarmStore(context)
    val existing = if (id.isNullOrBlank()) null else store.get(id)
    if (!id.isNullOrBlank() && existing == null) {
      throw IllegalArgumentException("Alarm not found.")
    }
    val now = System.currentTimeMillis()
    val finalImageId =
        if (!puzzleImageId.isNullOrBlank()) {
          puzzleImageId
        } else {
          existing?.puzzleImageId ?: AlarmDefaults.DEFAULT_PUZZLE_IMAGE_ID
        }
    val finalImageType =
        if (!puzzleImageType.isNullOrBlank()) {
          puzzleImageType
        } else {
          existing?.puzzleImageType ?: AlarmDefaults.DEFAULT_PUZZLE_IMAGE_TYPE
        }
    val finalDifficulty =
        if (!difficulty.isNullOrBlank() && difficulty in setOf("easy", "medium", "hard")) {
          difficulty
        } else {
          existing?.difficulty ?: AlarmDefaults.DIFFICULTY_EASY
        }

    val finalRepeatDays =
        if (repeatDays != null) {
          repeatDays.filter { day -> AlarmTime.isValidWeekday(day) }
        } else {
          existing?.repeatDays ?: emptyList()
        }
    val repeatType =
        if (finalRepeatDays.isNotEmpty()) AlarmDefaults.REPEAT_WEEKLY
        else AlarmDefaults.REPEAT_ONCE

    val nextTrigger =
        if (finalRepeatDays.isNotEmpty()) {
          AlarmTime.nextWeeklyTriggerMillis(
              hour,
              minute,
              finalRepeatDays,
              now,
              TimeZone.getDefault(),
          )
        } else {
          AlarmTime.nextClockTriggerMillis(hour, minute, now, TimeZone.getDefault())
        }

    val alarm =
        StoredAlarm(
            id = existing?.id ?: UUID.randomUUID().toString(),
            hour = hour,
            minute = minute,
            enabled = enabled,
            vibrate = vibrate,
            label = cleanLabel(label, AlarmDefaults.DEFAULT_LABEL),
            repeat = repeatType,
            difficulty = finalDifficulty,
            sound = AlarmDefaults.SOUND_SYSTEM_ALARM,
            triggerAtMillis = nextTrigger,
            createdAtMillis = existing?.createdAtMillis ?: now,
            puzzleImageId = finalImageId,
            puzzleImageType = finalImageType,
            repeatDays = finalRepeatDays,
        )
    store.upsert(alarm)
    try {
      AlarmScheduler.apply(context, alarm)
    } catch (error: Exception) {
      if (existing == null) {
        store.delete(alarm.id)
      } else {
        store.upsert(existing)
      }
      throw error
    }
    return alarm
  }

  fun scheduleTestAlarm(context: Context, offsetSeconds: Int): StoredAlarm {
    if (offsetSeconds !in
        AlarmDefaults.MIN_TEST_OFFSET_SECONDS..AlarmDefaults.MAX_TEST_OFFSET_SECONDS) {
      throw IllegalArgumentException(
          "Test alarm offset must be between ${AlarmDefaults.MIN_TEST_OFFSET_SECONDS} and ${AlarmDefaults.MAX_TEST_OFFSET_SECONDS} seconds.",
      )
    }
    val now = System.currentTimeMillis()
    val triggerAt = AlarmTime.testTriggerMillis(now, offsetSeconds)
    val calendar = Calendar.getInstance().apply { timeInMillis = triggerAt }
    val alarm =
        StoredAlarm(
            id = UUID.randomUUID().toString(),
            hour = calendar.get(Calendar.HOUR_OF_DAY),
            minute = calendar.get(Calendar.MINUTE),
            enabled = true,
            vibrate = true,
            label = AlarmDefaults.TEST_LABEL,
            repeat = AlarmDefaults.REPEAT_ONCE,
            difficulty = AlarmDefaults.DIFFICULTY_EASY,
            sound = AlarmDefaults.SOUND_SYSTEM_ALARM,
            triggerAtMillis = triggerAt,
            createdAtMillis = now,
            puzzleImageId = AlarmDefaults.DEFAULT_PUZZLE_IMAGE_ID,
            puzzleImageType = AlarmDefaults.DEFAULT_PUZZLE_IMAGE_TYPE,
            repeatDays = emptyList(),
        )
    val store = AlarmStore(context)
    store.upsert(alarm)
    try {
      AlarmScheduler.schedule(context, alarm)
    } catch (error: Exception) {
      store.delete(alarm.id)
      throw error
    }
    return alarm
  }

  fun setEnabled(context: Context, id: String, enabled: Boolean): StoredAlarm {
    val store = AlarmStore(context)
    val existing = store.get(id) ?: throw IllegalArgumentException("Alarm not found.")
    val updated =
        if (enabled) {
          val nextTrigger =
              if (existing.repeatDays.isNotEmpty()) {
                AlarmTime.nextWeeklyTriggerMillis(
                    existing.hour,
                    existing.minute,
                    existing.repeatDays,
                    System.currentTimeMillis(),
                    TimeZone.getDefault(),
                )
              } else {
                AlarmTime.nextClockTriggerMillis(
                    existing.hour,
                    existing.minute,
                    System.currentTimeMillis(),
                    TimeZone.getDefault(),
                )
              }
          existing.copy(
              enabled = true,
              triggerAtMillis = nextTrigger,
          )
        } else {
          existing.copy(enabled = false)
        }
    store.upsert(updated)
    try {
      AlarmScheduler.apply(context, updated)
    } catch (error: Exception) {
      store.upsert(existing)
      throw error
    }
    return updated
  }

  fun delete(context: Context, id: String) {
    AlarmScheduler.cancel(context, id)
    val removed = AlarmStore(context).delete(id)
    if (!removed) {
      throw IllegalArgumentException("Alarm not found.")
    }
  }

  private fun cleanLabel(label: String?, fallback: String): String {
    val trimmed = label?.trim().orEmpty()
    val value = if (trimmed.isEmpty()) fallback else trimmed
    return value.take(AlarmDefaults.MAX_LABEL_LENGTH)
  }
}
