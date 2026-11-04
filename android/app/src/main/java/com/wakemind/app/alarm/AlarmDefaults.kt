package com.wakemind.app.alarm

internal object AlarmDefaults {
  const val REPEAT_ONCE = "once"
  const val REPEAT_WEEKLY = "weekly"
  const val DIFFICULTY_EASY = "easy"
  const val SOUND_SYSTEM_ALARM = "system-alarm"
  const val DEFAULT_ALARM_SOUND_ID = "gentle_morning"
  val BUNDLED_SOUND_IDS =
      setOf(
          "gentle_morning",
          "classic_alarm",
          "deep_wake",
          "nature_wake",
          "energetic_wake",
      )
  const val DEFAULT_LABEL = "Alarm"
  const val TEST_LABEL = "Test alarm"
  const val MIN_TEST_OFFSET_SECONDS = 5
  const val MAX_TEST_OFFSET_SECONDS = 300
  const val MAX_LABEL_LENGTH = 80
  const val DEFAULT_PUZZLE_IMAGE_ID = "moraine-lake"
  const val DEFAULT_PUZZLE_IMAGE_TYPE = "bundled"
}
