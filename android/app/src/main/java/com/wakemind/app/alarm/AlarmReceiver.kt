package com.wakemind.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import java.util.TimeZone

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val alarmId = intent.getStringExtra(AlarmIntents.EXTRA_ALARM_ID)
    if (alarmId.isNullOrBlank()) {
      Log.e(ALARM_LOG_TAG, "Alarm fired without an id.")
      return
    }
    try {
      val store = AlarmStore(context)
      val alarm = store.get(alarmId)
      if (alarm == null) {
        Log.e(ALARM_LOG_TAG, "Alarm $alarmId fired but it is not in local storage.")
        return
      }

      if (alarm.repeatDays.isNotEmpty()) {
        val nextTrigger =
            AlarmTime.nextWeeklyTriggerMillis(
                alarm.hour,
                alarm.minute,
                alarm.repeatDays,
                System.currentTimeMillis(),
                TimeZone.getDefault(),
            )
        val recurringAlarm = alarm.copy(enabled = true, triggerAtMillis = nextTrigger)
        store.upsert(recurringAlarm)
        AlarmScheduler.schedule(context, recurringAlarm)
      } else {
        store.markFired(alarmId)
        AlarmScheduler.cancel(context, alarmId)
      }

      AlarmRingtoneService.start(context, alarm)
      Log.i(ALARM_LOG_TAG, "Alarm $alarmId fired.")
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Failed to start alarm $alarmId", error)
    }
  }
}
