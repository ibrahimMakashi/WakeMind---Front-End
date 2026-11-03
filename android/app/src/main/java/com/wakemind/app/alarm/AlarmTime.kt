package com.wakemind.app.alarm

import java.util.Calendar
import java.util.TimeZone

internal object AlarmTime {
  const val TEST_OFFSET_SECONDS = 60
  const val RINGING_SAFETY_MINUTES = 15

  val VALID_WEEKDAYS = setOf("mon", "tue", "wed", "thu", "fri", "sat", "sun")

  fun isValidWeekday(day: String): Boolean = day.trim().lowercase() in VALID_WEEKDAYS

  fun weekdayToCalendarDay(day: String): Int {
    return when (day.trim().lowercase()) {
      "sun" -> Calendar.SUNDAY
      "mon" -> Calendar.MONDAY
      "tue" -> Calendar.TUESDAY
      "wed" -> Calendar.WEDNESDAY
      "thu" -> Calendar.THURSDAY
      "fri" -> Calendar.FRIDAY
      "sat" -> Calendar.SATURDAY
      else -> throw IllegalArgumentException("Invalid weekday: $day")
    }
  }

  fun nextClockTriggerMillis(
      hour: Int,
      minute: Int,
      nowMillis: Long,
      timeZone: TimeZone,
  ): Long {
    require(hour in 0..23) { "Hour must be between 0 and 23." }
    require(minute in 0..59) { "Minute must be between 0 and 59." }
    val calendar = Calendar.getInstance(timeZone)
    calendar.timeInMillis = nowMillis
    calendar.set(Calendar.HOUR_OF_DAY, hour)
    calendar.set(Calendar.MINUTE, minute)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    if (calendar.timeInMillis <= nowMillis) {
      calendar.add(Calendar.DATE, 1)
    }
    return calendar.timeInMillis
  }

  fun nextWeeklyTriggerMillis(
      hour: Int,
      minute: Int,
      selectedDays: Collection<String>,
      nowMillis: Long,
      timeZone: TimeZone,
  ): Long {
    require(hour in 0..23) { "Hour must be between 0 and 23." }
    require(minute in 0..59) { "Minute must be between 0 and 59." }
    val targetDays =
        selectedDays
            .mapNotNull { day -> if (isValidWeekday(day)) weekdayToCalendarDay(day) else null }
            .toSet()
    require(targetDays.isNotEmpty()) {
      "At least one valid weekday must be selected for weekly alarms."
    }

    for (offset in 0..7) {
      val calendar = Calendar.getInstance(timeZone)
      calendar.timeInMillis = nowMillis
      calendar.add(Calendar.DATE, offset)
      calendar.set(Calendar.HOUR_OF_DAY, hour)
      calendar.set(Calendar.MINUTE, minute)
      calendar.set(Calendar.SECOND, 0)
      calendar.set(Calendar.MILLISECOND, 0)

      val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)
      if (dayOfWeek in targetDays && calendar.timeInMillis > nowMillis) {
        return calendar.timeInMillis
      }
    }

    return nextClockTriggerMillis(hour, minute, nowMillis, timeZone)
  }

  fun testTriggerMillis(
      nowMillis: Long,
      offsetSeconds: Int = TEST_OFFSET_SECONDS,
  ): Long {
    return nowMillis + offsetSeconds * 1000L
  }

  fun triggerAfterChange(
      hour: Int,
      minute: Int,
      existingTriggerMillis: Long,
      nowMillis: Long,
      timeZone: TimeZone,
  ): Long {
    if (existingTriggerMillis > nowMillis &&
        localField(existingTriggerMillis, timeZone, Calendar.HOUR_OF_DAY) == hour &&
        localField(existingTriggerMillis, timeZone, Calendar.MINUTE) == minute) {
      return existingTriggerMillis
    }
    return nextClockTriggerMillis(hour, minute, nowMillis, timeZone)
  }

  private fun localField(timeMillis: Long, timeZone: TimeZone, field: Int): Int {
    val calendar = Calendar.getInstance(timeZone)
    calendar.timeInMillis = timeMillis
    return calendar.get(field)
  }
}
