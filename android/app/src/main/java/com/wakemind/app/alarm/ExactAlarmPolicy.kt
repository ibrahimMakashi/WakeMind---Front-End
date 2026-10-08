package com.wakemind.app.alarm

internal enum class ExactAlarmAccess {
  GRANTED,
  NEEDS_SCHEDULE_EXACT_ALARM_GRANT,
  UNAVAILABLE,
}

internal object ExactAlarmPolicy {
  const val ANDROID_12 = 31
  const val ANDROID_12L = 32

  fun decide(sdkInt: Int, canScheduleExactAlarms: Boolean): ExactAlarmAccess {
    if (sdkInt < ANDROID_12) {
      return ExactAlarmAccess.GRANTED
    }
    if (canScheduleExactAlarms) {
      return ExactAlarmAccess.GRANTED
    }
    if (sdkInt <= ANDROID_12L) {
      return ExactAlarmAccess.NEEDS_SCHEDULE_EXACT_ALARM_GRANT
    }
    return ExactAlarmAccess.UNAVAILABLE
  }

  fun toStatus(access: ExactAlarmAccess): String {
    return when (access) {
      ExactAlarmAccess.GRANTED -> "granted"
      ExactAlarmAccess.NEEDS_SCHEDULE_EXACT_ALARM_GRANT -> "needsScheduleExactAlarmGrant"
      ExactAlarmAccess.UNAVAILABLE -> "unavailable"
    }
  }
}
