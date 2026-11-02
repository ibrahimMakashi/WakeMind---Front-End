package com.wakemind.app.alarm

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
    val sound: String,
    val triggerAtMillis: Long,
    val createdAtMillis: Long,
    val puzzleImageId: String = AlarmDefaults.DEFAULT_PUZZLE_IMAGE_ID,
    val puzzleImageType: String = AlarmDefaults.DEFAULT_PUZZLE_IMAGE_TYPE,
) {
  fun toJson(): JSONObject {
    return JSONObject()
        .put("id", id)
        .put("hour", hour)
        .put("minute", minute)
        .put("enabled", enabled)
        .put("vibrate", vibrate)
        .put("label", label)
        .put("repeat", repeat)
        .put("difficulty", difficulty)
        .put("sound", sound)
        .put("triggerAtMillis", triggerAtMillis)
        .put("createdAtMillis", createdAtMillis)
        .put("puzzleImageId", puzzleImageId)
        .put("puzzleImageType", puzzleImageType)
  }

  companion object {
    fun fromJson(json: JSONObject): StoredAlarm {
      val rawImageId = json.optString("puzzleImageId", AlarmDefaults.DEFAULT_PUZZLE_IMAGE_ID)
      val rawImageType = json.optString("puzzleImageType", AlarmDefaults.DEFAULT_PUZZLE_IMAGE_TYPE)
      val rawDifficulty = json.optString("difficulty", AlarmDefaults.DIFFICULTY_EASY)
      val finalDifficulty = if (rawDifficulty in setOf("easy", "medium", "hard")) rawDifficulty else AlarmDefaults.DIFFICULTY_EASY

      return StoredAlarm(
          id = requiredString(json, "id"),
          hour = requiredInt(json, "hour"),
          minute = requiredInt(json, "minute"),
          enabled = requiredBoolean(json, "enabled"),
          vibrate = requiredBoolean(json, "vibrate"),
          label = requiredString(json, "label"),
          repeat = requiredString(json, "repeat"),
          difficulty = finalDifficulty,
          sound = requiredString(json, "sound"),
          triggerAtMillis = requiredLong(json, "triggerAtMillis"),
          createdAtMillis = requiredLong(json, "createdAtMillis"),
          puzzleImageId = if (rawImageId.isNullOrBlank()) AlarmDefaults.DEFAULT_PUZZLE_IMAGE_ID else rawImageId,
          puzzleImageType = if (rawImageType.isNullOrBlank()) AlarmDefaults.DEFAULT_PUZZLE_IMAGE_TYPE else rawImageType,
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
