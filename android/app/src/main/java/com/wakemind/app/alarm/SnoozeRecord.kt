package com.wakemind.app.alarm

import org.json.JSONObject

internal data class SnoozeRecord(
    val alarmId: String,
    val occurrenceId: String,
    val triggerAtMillis: Long,
    val snoozeCount: Int,
    val isPending: Boolean,
    val label: String,
    val vibrate: Boolean,
    val puzzleImageId: String,
    val puzzleImageType: String,
    val difficulty: String,
    val sound: String,
) {
  fun toJson(): JSONObject =
      JSONObject().apply {
        put("alarmId", alarmId)
        put("occurrenceId", occurrenceId)
        put("triggerAtMillis", triggerAtMillis)
        put("snoozeCount", snoozeCount)
        put("isPending", isPending)
        put("label", label)
        put("vibrate", vibrate)
        put("puzzleImageId", puzzleImageId)
        put("puzzleImageType", puzzleImageType)
        put("difficulty", difficulty)
        put("sound", sound)
      }

  companion object {
    fun fromJson(json: JSONObject): SnoozeRecord =
        SnoozeRecord(
            alarmId = requiredString(json, "alarmId"),
            occurrenceId = requiredString(json, "occurrenceId"),
            triggerAtMillis = requiredLong(json, "triggerAtMillis"),
            snoozeCount = requiredInt(json, "snoozeCount"),
            isPending = requiredBoolean(json, "isPending"),
            label = json.optString("label", AlarmDefaults.DEFAULT_LABEL),
            vibrate = json.optBoolean("vibrate", true),
            puzzleImageId = json.optString("puzzleImageId", AlarmDefaults.DEFAULT_PUZZLE_IMAGE_ID),
            puzzleImageType = json.optString("puzzleImageType", AlarmDefaults.DEFAULT_PUZZLE_IMAGE_TYPE),
            difficulty = json.optString("difficulty", AlarmDefaults.DIFFICULTY_EASY),
            sound = json.optString("sound", AlarmDefaults.DEFAULT_ALARM_SOUND_ID),
        )

    private fun requiredString(json: JSONObject, key: String): String {
      if (!json.has(key) || json.isNull(key)) {
        throw IllegalArgumentException("Snooze record is missing $key.")
      }
      return json.getString(key)
    }

    private fun requiredLong(json: JSONObject, key: String): Long {
      if (!json.has(key) || json.isNull(key)) {
        throw IllegalArgumentException("Snooze record is missing $key.")
      }
      return json.getLong(key)
    }

    private fun requiredInt(json: JSONObject, key: String): Int {
      if (!json.has(key) || json.isNull(key)) {
        throw IllegalArgumentException("Snooze record is missing $key.")
      }
      return json.getInt(key)
    }

    private fun requiredBoolean(json: JSONObject, key: String): Boolean {
      if (!json.has(key) || json.isNull(key)) {
        throw IllegalArgumentException("Snooze record is missing $key.")
      }
      return json.getBoolean(key)
    }
  }
}
