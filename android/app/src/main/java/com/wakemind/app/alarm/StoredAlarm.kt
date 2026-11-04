package com.wakemind.app.alarm

import org.json.JSONArray
import org.json.JSONObject

internal data class StoredAlarm(
    val id: String,
    val hour: Int,
    val minute: Int,
    val enabled: Boolean,
    val vibrate: Boolean,
    val label: String,
    val repeat: String,
    val difficulty: String,
    val sound: String = AlarmDefaults.DEFAULT_ALARM_SOUND_ID,
    val triggerAtMillis: Long,
    val createdAtMillis: Long,
    val puzzleImageId: String = AlarmDefaults.DEFAULT_PUZZLE_IMAGE_ID,
    val puzzleImageType: String = AlarmDefaults.DEFAULT_PUZZLE_IMAGE_TYPE,
    val repeatDays: List<String> = emptyList(),
) {
  fun toJson(): JSONObject {
    val normalized =
        try {
          AlarmTime.normalizeRepeatDays(repeatDays)
        } catch (_: Exception) {
          repeatDays
        }
    val daysArray = JSONArray()
    normalized.forEach { day -> daysArray.put(day) }

    val json = JSONObject()
    json.put("id", id)
    json.put("hour", hour)
    json.put("minute", minute)
    json.put("enabled", enabled)
    json.put("vibrate", vibrate)
    json.put("label", label)
    json.put("repeat", repeat)
    json.put("difficulty", difficulty)
    json.put("sound", sound)
    json.put("triggerAtMillis", triggerAtMillis)
    json.put("createdAtMillis", createdAtMillis)
    json.put("puzzleImageId", puzzleImageId)
    json.put("puzzleImageType", puzzleImageType)
    json.put("repeatDays", daysArray)
    return json
  }

  companion object {
    fun fromJson(json: JSONObject): StoredAlarm {
      val rawImageId = json.optString("puzzleImageId", AlarmDefaults.DEFAULT_PUZZLE_IMAGE_ID)
      val rawImageType = json.optString("puzzleImageType", AlarmDefaults.DEFAULT_PUZZLE_IMAGE_TYPE)
      val rawDifficulty = json.optString("difficulty", AlarmDefaults.DIFFICULTY_EASY)
      val finalDifficulty =
          if (rawDifficulty in setOf("easy", "medium", "hard")) rawDifficulty
          else AlarmDefaults.DIFFICULTY_EASY

      val rawDays = json.optJSONArray("repeatDays")
      val repeatDaysList =
          if (rawDays != null) {
            val rawList = mutableListOf<String>()
            for (i in 0 until rawDays.length()) {
              val day = rawDays.optString(i)
              if (!day.isNullOrBlank()) {
                rawList.add(day)
              }
            }
            // Backward-compatible normalization for stored alarms
            try {
              AlarmTime.normalizeRepeatDays(rawList)
            } catch (_: Exception) {
              rawList
                  .filter { AlarmTime.isValidWeekday(it) }
                  .map { it.trim().lowercase() }
                  .distinct()
                  .sortedBy { AlarmTime.ORDERED_WEEKDAYS.indexOf(it) }
            }
          } else {
            emptyList()
          }

      return StoredAlarm(
          id = requiredString(json, "id"),
          hour = requiredInt(json, "hour"),
          minute = requiredInt(json, "minute"),
          enabled = requiredBoolean(json, "enabled"),
          vibrate = requiredBoolean(json, "vibrate"),
          label = requiredString(json, "label"),
          repeat = requiredString(json, "repeat"),
          difficulty = finalDifficulty,
          sound =
              json.optString("sound").takeIf { !it.isNullOrBlank() }
                  ?: AlarmDefaults.DEFAULT_ALARM_SOUND_ID,
          triggerAtMillis = requiredLong(json, "triggerAtMillis"),
          createdAtMillis = requiredLong(json, "createdAtMillis"),
          puzzleImageId =
              if (rawImageId.isNullOrBlank()) AlarmDefaults.DEFAULT_PUZZLE_IMAGE_ID else rawImageId,
          puzzleImageType =
              if (rawImageType.isNullOrBlank()) AlarmDefaults.DEFAULT_PUZZLE_IMAGE_TYPE
              else rawImageType,
          repeatDays = repeatDaysList,
      )
    }

    private fun requiredString(json: JSONObject, key: String): String {
      if (!json.has(key) || json.isNull(key)) {
        throw IllegalArgumentException("Alarm record is missing $key.")
      }
      return json.getString(key)
    }

    private fun requiredInt(json: JSONObject, key: String): Int {
      if (!json.has(key) || json.isNull(key)) {
        throw IllegalArgumentException("Alarm record is missing $key.")
      }
      return json.getInt(key)
    }

    private fun requiredLong(json: JSONObject, key: String): Long {
      if (!json.has(key) || json.isNull(key)) {
        throw IllegalArgumentException("Alarm record is missing $key.")
      }
      return json.getLong(key)
    }

    private fun requiredBoolean(json: JSONObject, key: String): Boolean {
      if (!json.has(key) || json.isNull(key)) {
        throw IllegalArgumentException("Alarm record is missing $key.")
      }
      return json.getBoolean(key)
    }
  }
}
