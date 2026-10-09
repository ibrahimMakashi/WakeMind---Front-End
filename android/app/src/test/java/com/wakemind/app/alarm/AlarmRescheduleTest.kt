package com.wakemind.app.alarm

import java.util.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AlarmRescheduleTest {
  private val zone = TimeZone.getTimeZone("UTC")

  @Test
  fun reschedulesOnlyEnabledAlarms() {
    val now = 1_000L
    val enabled = alarm("enabled", enabled = true, triggerAtMillis = 5_000L)
    val disabled = alarm("disabled", enabled = false, triggerAtMillis = 2_000L)
    val plan = AlarmReschedule.plan(listOf(enabled, disabled), now, zone)
    assertEquals(listOf("enabled"), plan.map { item -> item.id })
    assertEquals(5_000L, plan.single().triggerAtMillis)
  }

  @Test
  fun keepsTheSameRequestCodeForAnEditedAlarm() {
    val code = AlarmReschedule.requestCode("alarm-1")
    assertEquals(code, AlarmReschedule.requestCode("alarm-1"))
    assertTrue(code >= 0)
  }

  private fun alarm(id: String, enabled: Boolean, triggerAtMillis: Long): StoredAlarm {
    return StoredAlarm(
        id = id,
        hour = 0,
        minute = 0,
        enabled = enabled,
        vibrate = true,
        label = "Alarm",
        repeat = AlarmDefaults.REPEAT_ONCE,
        difficulty = AlarmDefaults.DIFFICULTY_EASY,
        sound = AlarmDefaults.SOUND_SYSTEM_ALARM,
        triggerAtMillis = triggerAtMillis,
        createdAtMillis = 1L,
    )
  }
}
