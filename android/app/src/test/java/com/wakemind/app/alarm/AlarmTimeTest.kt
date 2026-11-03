package com.wakemind.app.alarm

import java.util.Calendar
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

  @Test
  fun schedulesWeeklyLaterTodayIfSelected() {
    val now = utc(2026, 10, 8, 8, 0) // Thursday
    val trigger = AlarmTime.nextWeeklyTriggerMillis(9, 30, listOf("thu"), now, timeZone)
    assertEquals(utc(2026, 10, 8, 9, 30), trigger)
  }

  @Test
  fun rollsWeeklySameDayPastTimeToNextWeek() {
    val now = utc(2026, 10, 8, 10, 0) // Thursday
    val trigger = AlarmTime.nextWeeklyTriggerMillis(9, 30, listOf("thu"), now, timeZone)
    assertEquals(utc(2026, 10, 15, 9, 30), trigger)
  }

  @Test
  fun schedulesWeeklyEarliestUpcomingDay() {
    val now = utc(2026, 10, 8, 10, 0) // Thursday
    val trigger = AlarmTime.nextWeeklyTriggerMillis(7, 0, listOf("fri", "mon"), now, timeZone)
    assertEquals(utc(2026, 10, 9, 7, 0), trigger) // Friday
  }

  @Test
  fun rollsWeeklyOverWeekendToNextWeek() {
    val now = utc(2026, 10, 8, 10, 0) // Thursday
    val trigger = AlarmTime.nextWeeklyTriggerMillis(7, 0, listOf("mon", "wed"), now, timeZone)
    assertEquals(utc(2026, 10, 12, 7, 0), trigger) // Monday
  }

  @Test
  fun schedulesSundayToMondayRollover() {
    // 2026-10-11 is Sunday
    val sundayNight = utc(2026, 10, 11, 22, 0)
    val mondayMorning = AlarmTime.nextWeeklyTriggerMillis(6, 0, listOf("mon"), sundayNight, timeZone)
    assertEquals(utc(2026, 10, 12, 6, 0), mondayMorning)
  }

  @Test
  fun rollsPastSundayTimeToNextSunday() {
    // 2026-10-11 is Sunday
    val sundayLate = utc(2026, 10, 11, 14, 0)
    val nextSunday = AlarmTime.nextWeeklyTriggerMillis(8, 0, listOf("sun"), sundayLate, timeZone)
    assertEquals(utc(2026, 10, 18, 8, 0), nextSunday)
  }

  @Test
  fun schedulesMultipleSelectedDaysInSequence() {
    // 2026-10-06 is Tuesday
    val tueNoon = utc(2026, 10, 6, 12, 0)
    val selectedDays = listOf("tue", "thu", "sat")

    // Past Tuesday noon -> next is Thursday
    val nextThu = AlarmTime.nextWeeklyTriggerMillis(7, 0, selectedDays, tueNoon, timeZone)
    assertEquals(utc(2026, 10, 8, 7, 0), nextThu)

    // After Thursday 7am -> next is Saturday
    val thuAfter = utc(2026, 10, 8, 8, 0)
    val nextSat = AlarmTime.nextWeeklyTriggerMillis(7, 0, selectedDays, thuAfter, timeZone)
    assertEquals(utc(2026, 10, 10, 7, 0), nextSat)

    // After Saturday 7am -> rolls around to next Tuesday
    val satAfter = utc(2026, 10, 10, 9, 0)
    val nextTue = AlarmTime.nextWeeklyTriggerMillis(7, 0, selectedDays, satAfter, timeZone)
    assertEquals(utc(2026, 10, 13, 7, 0), nextTue)
  }

  @Test
  fun handlesWeeklyTimezoneShiftCorrectly() {
    val newYork = TimeZone.getTimeZone("America/New_York")
    // In NY, 2026-10-11 is Sunday.
    // 22:00 EDT on Sunday in NY is 2026-10-12 02:00 UTC
    val nySundayNight = Calendar.getInstance(newYork).apply {
      set(2026, Calendar.OCTOBER, 11, 22, 0, 0)
      set(Calendar.MILLISECOND, 0)
    }.timeInMillis

    val trigger = AlarmTime.nextWeeklyTriggerMillis(6, 30, listOf("mon"), nySundayNight, newYork)

    val expectedNyMonday = Calendar.getInstance(newYork).apply {
      set(2026, Calendar.OCTOBER, 12, 6, 30, 0)
      set(Calendar.MILLISECOND, 0)
    }.timeInMillis

    assertEquals(expectedNyMonday, trigger)
  }

  @Test
  fun rejectsEmptyOrInvalidWeeklyDays() {
    val now = utc(2026, 10, 8, 10, 0)
    assertThrows(IllegalArgumentException::class.java) {
      AlarmTime.nextWeeklyTriggerMillis(7, 0, emptyList(), now, timeZone)
    }
    assertThrows(IllegalArgumentException::class.java) {
      AlarmTime.nextWeeklyTriggerMillis(7, 0, listOf("invalid"), now, timeZone)
    }
  }

  @Test
  fun normalizesAndDeduplicatesWeekdaysInOrder() {
    val normalized = AlarmTime.normalizeRepeatDays(listOf("fri", "mon", "fri", "wed"))
    assertEquals(listOf("mon", "wed", "fri"), normalized)
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
