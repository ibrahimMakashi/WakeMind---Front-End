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
  fun reenabledPastMinuteIsScheduledTomorrow() {
    val now = utc(2026, 10, 9, 21, 50)
    assertEquals(
        utc(2026, 10, 10, 21, 40),
        AlarmTime.nextClockTriggerMillis(21, 40, now, timeZone),
    )
  }

  @Test
  fun addsTheTestOffset() {
    assertEquals(1_060_000L, AlarmTime.testTriggerMillis(1_000_000L, 60))
  }

  @Test
  fun keepsAnUpcomingTriggerOnTheSavedMinute() {
    val trigger = utc(2026, 10, 9, 21, 46) + 27_000L
    val now = utc(2026, 10, 9, 21, 40)
    assertEquals(trigger, AlarmTime.triggerAfterChange(21, 46, trigger, now, timeZone))
  }

  @Test
  fun movesATriggerThatIsAlreadyPastToTheNextDay() {
    val trigger = utc(2026, 10, 9, 21, 46) + 27_000L
    val now = utc(2026, 10, 9, 21, 47)
    assertEquals(
        utc(2026, 10, 10, 21, 46),
        AlarmTime.triggerAfterChange(21, 46, trigger, now, timeZone),
    )
  }

  @Test
  fun recalculatesWhenTheTimezoneChangesTheLocalTime() {
    val kolkata = TimeZone.getTimeZone("Asia/Kolkata")
    val trigger = utc(2026, 10, 9, 16, 16)
    val now = utc(2026, 10, 9, 16, 0)
    assertEquals(trigger, AlarmTime.triggerAfterChange(21, 46, trigger, now, kolkata))
    assertEquals(
        utc(2026, 10, 9, 21, 46),
        AlarmTime.triggerAfterChange(21, 46, trigger, now, timeZone),
    )
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
