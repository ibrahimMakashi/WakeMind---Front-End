package com.wakemind.app.alarm

internal object AlarmIntents {
  const val ACTION_FIRE = "com.wakemind.app.alarm.FIRE"
  const val ACTION_START = "com.wakemind.app.alarm.START"
  const val ACTION_STOP = "com.wakemind.app.alarm.STOP"
  const val EXTRA_ALARM_ID = "alarmId"
  const val EXTRA_LABEL = "label"
  const val EXTRA_VIBRATE = "vibrate"
  const val EXTRA_TRIGGER_AT = "triggerAt"
}
