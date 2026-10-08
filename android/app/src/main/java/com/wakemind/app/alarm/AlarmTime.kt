package com.wakemind.app.alarm

import java.util.Calendar
import java.util.TimeZone

internal object AlarmTime {
  const val TEST_OFFSET_SECONDS = 60
  const val RINGING_SAFETY_MINUTES = 15

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

  fun testTriggerMillis(
      nowMillis: Long,
      offsetSeconds: Int = TEST_OFFSET_SECONDS,
  ): Long {
    return nowMillis + offsetSeconds * 1000L
  }
}
