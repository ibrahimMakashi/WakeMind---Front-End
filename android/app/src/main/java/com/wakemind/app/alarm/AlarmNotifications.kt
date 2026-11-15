package com.wakemind.app.alarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

internal object AlarmNotifications {
  const val CHANNEL_ID = "wakemind.alarm.v1"
  const val NOTIFICATION_ID = 4101

  fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val manager = context.getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) != null) {
      return
    }
    val channel =
        NotificationChannel(CHANNEL_ID, "Alarms", NotificationManager.IMPORTANCE_HIGH).apply {
          description = "WakeMind alarms"
          setSound(null, null)
          enableVibration(false)
          lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }
    manager.createNotificationChannel(channel)
  }

  fun buildRingingNotification(
      context: Context,
      alarmId: String,
      label: String,
      vibrate: Boolean,
      triggerAtMillis: Long,
      puzzleImageId: String? = null,
      puzzleImageType: String? = null,
      difficulty: String? = null,
      occurrenceId: String = "${alarmId}_${triggerAtMillis}",
      canSnooze: Boolean = true,
      sound: String = AlarmDefaults.DEFAULT_ALARM_SOUND_ID,
  ): Notification {
    val activityIntent =
        ringingIntent(
            context,
            alarmId,
            label,
            vibrate,
            triggerAtMillis,
            puzzleImageId,
            puzzleImageType,
            difficulty,
            occurrenceId,
            canSnooze,
            sound,
        )
    val contentPending =
        PendingIntent.getActivity(
            context,
            contentRequestCode(alarmId, occurrenceId),
            activityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    val stopPending =
        PendingIntent.getActivity(
            context,
            stopActionRequestCode(alarmId, occurrenceId),
            activityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    val builder =
        NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(com.wakemind.app.R.drawable.ic_alarm_notification)
            .setContentTitle("WakeMind")
            .setContentText(label)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setFullScreenIntent(contentPending, true)
            .setContentIntent(contentPending)
            .addAction(com.wakemind.app.R.drawable.ic_alarm_notification, "STOP", stopPending)

    if (canSnooze) {
      val snoozeIntent =
          Intent(context, AlarmActionReceiver::class.java).apply {
            action = AlarmIntents.ACTION_SNOOZE
            putExtra(AlarmIntents.EXTRA_ALARM_ID, alarmId)
            putExtra(AlarmIntents.EXTRA_OCCURRENCE_ID, occurrenceId)
            putExtra(AlarmIntents.EXTRA_IS_SNOOZE, true)
          }
      val snoozePending =
          PendingIntent.getBroadcast(
              context,
              snoozeActionRequestCode(alarmId, occurrenceId),
              snoozeIntent,
              PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
          )
      builder.addAction(com.wakemind.app.R.drawable.ic_alarm_notification, "SNOOZE 5 MIN", snoozePending)
    }

    return builder.build()
  }

  fun ringingIntent(
      context: Context,
      alarmId: String,
      label: String,
      vibrate: Boolean,
      triggerAtMillis: Long,
      puzzleImageId: String? = null,
      puzzleImageType: String? = null,
      difficulty: String? = null,
      occurrenceId: String? = null,
      canSnooze: Boolean = true,
      sound: String = AlarmDefaults.DEFAULT_ALARM_SOUND_ID,
  ): Intent {
    val storeAlarm =
        if (puzzleImageId.isNullOrBlank() || difficulty.isNullOrBlank()) AlarmStore(context).get(alarmId)
        else null
    val finalImageId = puzzleImageId ?: storeAlarm?.puzzleImageId ?: AlarmDefaults.DEFAULT_PUZZLE_IMAGE_ID
    val finalImageType = puzzleImageType ?: storeAlarm?.puzzleImageType ?: AlarmDefaults.DEFAULT_PUZZLE_IMAGE_TYPE
    val finalDifficulty = difficulty ?: storeAlarm?.difficulty ?: AlarmDefaults.DIFFICULTY_EASY
    val finalSound = if (sound != AlarmDefaults.DEFAULT_ALARM_SOUND_ID) sound else (storeAlarm?.sound ?: sound)
    val finalOccId = occurrenceId ?: "${alarmId}_${triggerAtMillis}"

    return Intent(context, RingingActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
      putExtra(AlarmIntents.EXTRA_ALARM_ID, alarmId)
      putExtra(AlarmIntents.EXTRA_OCCURRENCE_ID, finalOccId)
      putExtra(AlarmIntents.EXTRA_CAN_SNOOZE, canSnooze)
      putExtra(AlarmIntents.EXTRA_LABEL, label)
      putExtra(AlarmIntents.EXTRA_VIBRATE, vibrate)
      putExtra(AlarmIntents.EXTRA_TRIGGER_AT, triggerAtMillis)
      putExtra(AlarmIntents.EXTRA_PUZZLE_IMAGE_ID, finalImageId)
      putExtra(AlarmIntents.EXTRA_PUZZLE_IMAGE_TYPE, finalImageType)
      putExtra(AlarmIntents.EXTRA_DIFFICULTY, finalDifficulty)
      putExtra(AlarmIntents.EXTRA_SOUND, finalSound)
    }
  }

  fun contentRequestCode(alarmId: String, occurrenceId: String): Int {
    return ("$alarmId:$occurrenceId:content").hashCode() and 0x7FFFFFFF
  }

  fun stopActionRequestCode(alarmId: String, occurrenceId: String): Int {
    return ("$alarmId:$occurrenceId:stop_action").hashCode() and 0x7FFFFFFF
  }

  fun snoozeActionRequestCode(alarmId: String, occurrenceId: String): Int {
    return ("$alarmId:$occurrenceId:snooze_action").hashCode() and 0x7FFFFFFF
  }
}
