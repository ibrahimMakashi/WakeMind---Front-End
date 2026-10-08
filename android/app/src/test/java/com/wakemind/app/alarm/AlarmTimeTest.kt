package com.wakemind.app.alarm

import java.util.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class AlarmTimeTest {
  private val timeZone = TimeZone.getTimeZone("UTC")

  @Test
  fun schedulesLaterToday() {
    val now = utc(2026, 10, 8, 8, 0)
    val trigger = AlarmTime.nextClockTriggerMillis(9, 30, now, timeZone)
    assertEquals(utc(2026, 10, 8, 9, 30), trigger)
  }

  @Test
  fun rollsPastTimesToTomorrow() {
    val now = utc(2026, 10, 8, 10, 15)
    val trigger = AlarmTime.nextClockTriggerMillis(9, 0, now, timeZone)
    assertEquals(utc(2026, 10, 9, 9, 0), trigger)
  }

  @Test
  fun rollsTheCurrentMinuteToTomorrow() {
    val now = utc(2026, 10, 8, 9, 0)
    val trigger = AlarmTime.nextClockTriggerMillis(9, 0, now, timeZone)
    assertEquals(utc(2026, 10, 9, 9, 0), trigger)
  }

  @Test
  fun rejectsAnInvalidHour() {
    assertThrows(IllegalArgumentException::class.java) {
      AlarmTime.nextClockTriggerMillis(24, 0, utc(2026, 10, 8, 9, 0), timeZone)
    }
  }

  @Test
  fun addsTheTestOffset() {
    assertEquals(1_060_000L, AlarmTime.testTriggerMillis(1_000_000L, 60))
  }

  private fun utc(year: Int, month: Int, day: Int, hour: Int, minute: Int): Long {
    val calendar = java.util.Calendar.getInstance(timeZone)
    calendar.set(java.util.Calendar.YEAR, year)
    calendar.set(java.util.Calendar.MONTH, month - 1)
    calendar.set(java.util.Calendar.DAY_OF_MONTH, day)
    calendar.set(java.util.Calendar.HOUR_OF_DAY, hour)
    calendar.set(java.util.Calendar.MINUTE, minute)
    calendar.set(java.util.Calendar.SECOND, 0)
    calendar.set(java.util.Calendar.MILLISECOND, 0)
    return calendar.timeInMillis
  }
}
