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
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
    val operation =
        PendingIntent.getBroadcast(
            context,
            requestCode(alarm.id),
            fireIntent(context, alarm.id),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    val show = showPendingIntent(context)
    try {
      if (alarmManager != null && operation != null && show != null) {
        alarmManager.setAlarmClock(AlarmManager.AlarmClockInfo(alarm.triggerAtMillis, show), operation)
      }
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
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
    val pending =
        PendingIntent.getBroadcast(
            context,
            requestCode(alarmId),
            fireIntent(context, alarmId),
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE,
        )
    if (pending != null) {
      alarmManager?.cancel(pending)
      pending.cancel()
      Log.i(ALARM_LOG_TAG, "Cancelled $alarmId")
    }
  }

  fun scheduleSnooze(context: Context, record: SnoozeRecord) {
    val access = currentAccess(context)
    if (access != ExactAlarmAccess.GRANTED) {
      Log.e(ALARM_LOG_TAG, "Refusing to schedule snooze for ${record.alarmId} (${record.occurrenceId}): $access")
      throw AlarmScheduleException(access)
    }
    if (record.triggerAtMillis <= System.currentTimeMillis()) {
      throw IllegalArgumentException("Snooze trigger time is in the past.")
    }
    cancelSnooze(context, record.alarmId, record.occurrenceId)

    val alarmManager =
        alarmManagerProvider(context)
            ?: throw IllegalStateException("AlarmManager unavailable")

    val requestCode = snoozeRequestCode(record.alarmId, record.occurrenceId)
    val fireIntent = snoozeFireIntent(context, record.alarmId, record.occurrenceId)

    val operation =
        pendingIntentFactory(
            context,
            requestCode,
            fireIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        ) ?: throw IllegalStateException("Failed to create snooze PendingIntent for ${record.occurrenceId}")

    val show = showPendingIntent(context)
    try {
      alarmManager.setAlarmClock(
          AlarmManager.AlarmClockInfo(record.triggerAtMillis, show),
          operation,
      )
    } catch (error: SecurityException) {
      Log.e(ALARM_LOG_TAG, "setAlarmClock rejected snooze for ${record.alarmId} (${record.occurrenceId})", error)
      val latestAccess = currentAccess(context)
      if (latestAccess != ExactAlarmAccess.GRANTED) {
        throw AlarmScheduleException(latestAccess)
      }
      throw IllegalStateException("Android rejected the exact snooze alarm.", error)
    }

    // Verify scheduled PendingIntent exists using the exact occurrence identity
    val verified =
        pendingIntentResolver(
            context,
            requestCode,
            fireIntent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE,
        ) ?: throw IllegalStateException("Scheduled snooze PendingIntent could not be verified for ${record.occurrenceId}")

    Log.i(ALARM_LOG_TAG, "Scheduled snooze for ${record.alarmId} (${record.occurrenceId}) at ${record.triggerAtMillis}")
  }

  fun cancelSnooze(context: Context, alarmId: String, occurrenceId: String) {
    val alarmManager = alarmManagerProvider(context)
    val requestCode = snoozeRequestCode(alarmId, occurrenceId)
    val fireIntent = snoozeFireIntent(context, alarmId, occurrenceId)
    val pending =
        pendingIntentResolver(
            context,
            requestCode,
            fireIntent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE,
        )
    if (pending != null) {
      alarmManager?.cancel(pending)
      pending.cancel()
      Log.i(ALARM_LOG_TAG, "Cancelled snooze for $alarmId ($occurrenceId)")
    }
  }

  internal var alarmManagerProvider: (Context) -> AlarmManager? = { context ->
    context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
  }

  internal var pendingIntentFactory: (Context, Int, Intent, Int) -> PendingIntent? = { context, req, intent, flags ->
    PendingIntent.getBroadcast(context, req, intent, flags)
  }

  internal var pendingIntentResolver: (Context, Int, Intent, Int) -> PendingIntent? = { context, req, intent, flags ->
    PendingIntent.getBroadcast(context, req, intent, flags)
  }

  internal fun resetProviders() {
    alarmManagerProvider = { context -> context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager }
    pendingIntentFactory = { context, req, intent, flags -> PendingIntent.getBroadcast(context, req, intent, flags) }
    pendingIntentResolver = { context, req, intent, flags -> PendingIntent.getBroadcast(context, req, intent, flags) }
  }

  fun snoozeRequestCode(alarmId: String, occurrenceId: String): Int {
    return ("$alarmId:$occurrenceId:snooze").hashCode() and 0x7FFFFFFF
  }

  private fun snoozeFireIntent(context: Context, alarmId: String, occurrenceId: String): Intent {
    return Intent(context, AlarmReceiver::class.java).apply {
      action = AlarmIntents.ACTION_FIRE
      putExtra(AlarmIntents.EXTRA_ALARM_ID, alarmId)
      putExtra(AlarmIntents.EXTRA_OCCURRENCE_ID, occurrenceId)
      putExtra(AlarmIntents.EXTRA_IS_SNOOZE, true)
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
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
    val canSchedule = alarmManager?.canScheduleExactAlarms() ?: true
    return ExactAlarmPolicy.decide(Build.VERSION.SDK_INT, canSchedule)
  }

  private fun fireIntent(context: Context, alarmId: String): Intent {
    return Intent(context, AlarmReceiver::class.java).apply {
      action = AlarmIntents.ACTION_FIRE
      putExtra(AlarmIntents.EXTRA_ALARM_ID, alarmId)
    }
  }

  private fun showPendingIntent(context: Context): PendingIntent? {
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
