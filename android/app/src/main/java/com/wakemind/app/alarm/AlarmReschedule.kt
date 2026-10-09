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
          alarm.copy(
              triggerAtMillis =
                  AlarmTime.triggerAfterChange(
                      alarm.hour,
                      alarm.minute,
                      alarm.triggerAtMillis,
                      nowMillis,
                      timeZone,
                  ),
          )
        }
  }

  fun requestCode(alarmId: String): Int {
    return alarmId.hashCode() and 0x7FFFFFFF
  }
}
