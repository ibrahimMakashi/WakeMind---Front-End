package com.wakemind.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

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
      store.markFired(alarmId)
      AlarmScheduler.cancel(context, alarmId)
      AlarmRingtoneService.start(context, alarm)
      Log.i(ALARM_LOG_TAG, "Alarm $alarmId fired.")
    } catch (error: Exception) {
      Log.e(ALARM_LOG_TAG, "Failed to start alarm $alarmId", error)
    }
  }
}
