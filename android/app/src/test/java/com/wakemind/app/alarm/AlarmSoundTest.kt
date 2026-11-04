package com.wakemind.app.alarm

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AlarmSoundTest {

  @Test
  fun testStoredAlarmSerializesAndDeserializesCustomSound() {
    val alarm =
        StoredAlarm(
            id = "test-custom-sound",
            hour = 7,
            minute = 15,
            enabled = true,
            vibrate = true,
            label = "Morning Meditation",
            repeat = "weekly",
            difficulty = "medium",
            sound = "deep_wake",
            triggerAtMillis = 1700000000000L,
            createdAtMillis = 1690000000000L,
            puzzleImageId = "moraine-lake",
            puzzleImageType = "bundled",
            repeatDays = listOf("mon", "wed", "fri"),
        )

    val json = alarm.toJson()
    assertEquals("deep_wake", json.getString("sound"))

    val restored = StoredAlarm.fromJson(json)
    assertEquals("deep_wake", restored.sound)
    assertEquals("medium", restored.difficulty)
    assertEquals(listOf("mon", "wed", "fri"), restored.repeatDays)
  }

  @Test
  fun testStoredAlarmBackwardCompatibilityWithoutSoundField() {
    // Legacy record from older app version where sound was not in JSON
    val legacyJson =
        JSONObject().apply {
          put("id", "legacy-alarm-1")
          put("hour", 6)
          put("minute", 30)
          put("enabled", true)
          put("vibrate", false)
          put("label", "Early Rise")
          put("repeat", "once")
          put("difficulty", "easy")
          put("triggerAtMillis", 1700000000000L)
          put("createdAtMillis", 1690000000000L)
          put("puzzleImageId", "moraine-lake")
          put("puzzleImageType", "bundled")
        }

    val alarm = StoredAlarm.fromJson(legacyJson)
    // Must gracefully fall back to default alarm sound ID without throwing
    assertEquals(AlarmDefaults.DEFAULT_ALARM_SOUND_ID, alarm.sound)
    assertEquals("gentle_morning", alarm.sound)
  }

  @Test
  fun testStoredAlarmHandlesBlankOrEmptySoundGracefully() {
    val blankSoundJson =
        JSONObject().apply {
          put("id", "blank-sound-alarm")
          put("hour", 8)
          put("minute", 0)
          put("enabled", true)
          put("vibrate", true)
          put("label", "Work")
          put("repeat", "once")
          put("difficulty", "easy")
          put("sound", "   ")
          put("triggerAtMillis", 1700000000000L)
          put("createdAtMillis", 1690000000000L)
        }

    val alarm = StoredAlarm.fromJson(blankSoundJson)
    assertEquals(AlarmDefaults.DEFAULT_ALARM_SOUND_ID, alarm.sound)
  }

  @Test
  fun testAllBundledSoundIdsRecognized() {
    val expectedTones =
        setOf("gentle_morning", "classic_alarm", "deep_wake", "nature_wake", "energetic_wake")
    assertEquals(expectedTones, AlarmDefaults.BUNDLED_SOUND_IDS)
  }
}
