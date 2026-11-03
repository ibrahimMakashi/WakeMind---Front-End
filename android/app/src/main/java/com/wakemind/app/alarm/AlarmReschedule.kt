package com.wakemind.app.alarm

import java.util.TimeZone

internal object AlarmReschedule {
  fun plan(
      alarms: List<StoredAlarm>,
      nowMillis: Long,
      timeZone: TimeZone,
  ): List<StoredAlarm> {
    return alarms
        .filter { alarm -> alarm.enabled }
        .map { alarm ->
          val nextTrigger =
              if (alarm.repeatDays.isNotEmpty()) {
                AlarmTime.nextWeeklyTriggerMillis(
                    alarm.hour,
                    alarm.minute,
                    alarm.repeatDays,
                    nowMillis,
                    timeZone,
                )
              } else {
                AlarmTime.triggerAfterChange(
                    alarm.hour,
                    alarm.minute,
                    alarm.triggerAtMillis,
                    nowMillis,
                    timeZone,
                )
              }
          alarm.copy(triggerAtMillis = nextTrigger)
        }
  }

  fun requestCode(alarmId: String): Int {
    return alarmId.hashCode() and 0x7FFFFFFF
  }
}
