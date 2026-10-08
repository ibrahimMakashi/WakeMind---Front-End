package com.wakemind.app.alarm

import org.junit.Assert.assertEquals
import org.junit.Test

class ExactAlarmPolicyTest {
  @Test
  fun allowsExactAlarmsBeforeAndroid12() {
    assertEquals(ExactAlarmAccess.GRANTED, ExactAlarmPolicy.decide(30, canScheduleExactAlarms = false))
  }

  @Test
  fun asksForTheAndroid12SettingWhenItIsMissing() {
    assertEquals(
        ExactAlarmAccess.NEEDS_SCHEDULE_EXACT_ALARM_GRANT,
        ExactAlarmPolicy.decide(31, canScheduleExactAlarms = false),
    )
    assertEquals(
        ExactAlarmAccess.NEEDS_SCHEDULE_EXACT_ALARM_GRANT,
        ExactAlarmPolicy.decide(32, canScheduleExactAlarms = false),
    )
  }

  @Test
  fun doesNotAskForAndroid12SettingsWhenUseExactAlarmShouldApply() {
    assertEquals(ExactAlarmAccess.GRANTED, ExactAlarmPolicy.decide(33, canScheduleExactAlarms = true))
    assertEquals(
        ExactAlarmAccess.UNAVAILABLE,
        ExactAlarmPolicy.decide(33, canScheduleExactAlarms = false),
    )
    assertEquals(
        ExactAlarmAccess.UNAVAILABLE,
        ExactAlarmPolicy.decide(36, canScheduleExactAlarms = false),
    )
  }
}
