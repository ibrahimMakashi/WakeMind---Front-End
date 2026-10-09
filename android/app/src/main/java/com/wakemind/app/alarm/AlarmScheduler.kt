package com.wakemind.app.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.wakemind.app.MainActivity
import java.util.TimeZone

internal class AlarmScheduleException(val access: ExactAlarmAccess) :
    Exception(
        when (access) {
          ExactAlarmAccess.NEEDS_SCHEDULE_EXACT_ALARM_GRANT ->
              "Exact alarms need the Alarms & reminders permission on Android 12."
          ExactAlarmAccess.UNAVAILABLE ->
              "Exact alarms are unavailable. Android 13 and later should grant them at install for an alarm clock."
          ExactAlarmAccess.GRANTED -> "Exact alarms are available."
        },
    )

internal object AlarmScheduler {
  fun apply(context: Context, alarm: StoredAlarm) {
    if (alarm.enabled) {
      schedule(context, alarm)
    } else {
      cancel(context, alarm.id)
    }
  }

  fun schedule(context: Context, alarm: StoredAlarm) {
    val access = currentAccess(context)
    if (access != ExactAlarmAccess.GRANTED) {
      Log.e(ALARM_LOG_TAG, "Refusing to schedule ${alarm.id}: $access")
      throw AlarmScheduleException(access)
    }
    if (alarm.triggerAtMillis <= System.currentTimeMillis()) {
      throw IllegalArgumentException("Alarm time is already in the past.")
    }
    cancel(context, alarm.id)
    val alarmManager = context.getSystemService(AlarmManager::class.java)
    val operation =
        PendingIntent.getBroadcast(
            context,
            requestCode(alarm.id),
            fireIntent(context, alarm.id),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    val show = showPendingIntent(context)
    try {
      alarmManager.setAlarmClock(AlarmManager.AlarmClockInfo(alarm.triggerAtMillis, show), operation)
    } catch (error: SecurityException) {
      Log.e(ALARM_LOG_TAG, "setAlarmClock rejected for ${alarm.id}", error)
      val latestAccess = currentAccess(context)
      if (latestAccess != ExactAlarmAccess.GRANTED) {
        throw AlarmScheduleException(latestAccess)
      }
      throw IllegalStateException("Android rejected the exact alarm.", error)
    }
    Log.i(ALARM_LOG_TAG, "Scheduled ${alarm.id} at ${alarm.triggerAtMillis}")
  }

  fun cancel(context: Context, alarmId: String) {
    val alarmManager = context.getSystemService(AlarmManager::class.java)
    val pending =
        PendingIntent.getBroadcast(
            context,
            requestCode(alarmId),
            fireIntent(context, alarmId),
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE,
        )
    if (pending != null) {
      alarmManager.cancel(pending)
      pending.cancel()
      Log.i(ALARM_LOG_TAG, "Cancelled $alarmId")
    }
  }

  fun rescheduleEnabled(context: Context) {
    val store = AlarmStore(context)
    val now = System.currentTimeMillis()
    AlarmReschedule.plan(store.list(), now, TimeZone.getDefault()).forEach { alarm ->
      try {
        store.upsert(alarm)
        schedule(context, alarm)
      } catch (error: Exception) {
        Log.e(ALARM_LOG_TAG, "Could not reschedule ${alarm.id}", error)
      }
    }
  }

  fun currentAccess(context: Context): ExactAlarmAccess {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      return ExactAlarmPolicy.decide(Build.VERSION.SDK_INT, canScheduleExactAlarms = true)
    }
    val alarmManager = context.getSystemService(AlarmManager::class.java)
    return ExactAlarmPolicy.decide(Build.VERSION.SDK_INT, alarmManager.canScheduleExactAlarms())
  }

  private fun fireIntent(context: Context, alarmId: String): Intent {
    return Intent(context, AlarmReceiver::class.java).apply {
      action = AlarmIntents.ACTION_FIRE
      putExtra(AlarmIntents.EXTRA_ALARM_ID, alarmId)
    }
  }

  private fun showPendingIntent(context: Context): PendingIntent {
    val intent =
        Intent(context, MainActivity::class.java).apply {
          flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
    return PendingIntent.getActivity(
        context,
        SHOW_REQUEST_CODE,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun requestCode(alarmId: String): Int {
    return AlarmReschedule.requestCode(alarmId)
  }

  private const val SHOW_REQUEST_CODE = 41001
}
